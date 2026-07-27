import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { buildDnftMetadata } from "@/lib/dnftMetadata";
import { sendDnftMetadata } from "@/lib/symbol/symbolMetadata";
import { generatePassportPng } from "@/lib/dnft/generatePassportPng";
import { uploadPngToPinata } from "@/lib/ipfs/uploadToPinata";

function calculateLevel(stampCount: number) {
  if (stampCount >= 7) {
    return {
      level: 4,
      title: "Campus Ambassador",
    };
  }

  if (stampCount >= 5) {
    return {
      level: 3,
      title: "Campus Member",
    };
  }

  if (stampCount >= 3) {
    return {
      level: 2,
      title: "Research Supporter",
    };
  }

  if (stampCount >= 1) {
    return {
      level: 1,
      title: "Explorer",
    };
  }

  return {
    level: 0,
    title: "Beginner",
  };
}

export async function POST(req: Request) {
  try {
    /*
     * CookieのSessionから現在のユーザーを取得する。
     * フロントからuserIdは受け取らない。
     */
    const currentUser = await requireUser();

    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("qrSecretCode" in body) ||
      typeof body.qrSecretCode !== "string"
    ) {
      return NextResponse.json(
        {
          message: "qrSecretCodeが必要です",
        },
        {
          status: 400,
        }
      );
    }

    const qrSecretCode = body.qrSecretCode.trim();

    if (!qrSecretCode) {
      return NextResponse.json(
        {
          message: "qrSecretCodeが必要です",
        },
        {
          status: 400,
        }
      );
    }

    const spot = await prisma.spot.findUnique({
      where: {
        qrSecretCode,
      },
    });

    if (!spot) {
      return NextResponse.json(
        {
          message: "無効なQRコードです",
        },
        {
          status: 404,
        }
      );
    }

    const existingLog = await prisma.stampLog.findUnique({
      where: {
        userId_spotId: {
          userId: currentUser.id,
          spotId: spot.id,
        },
      },
    });

    if (existingLog) {
      return NextResponse.json(
        {
          message: "このスタンプは既に取得済みです",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.stampLog.create({
      data: {
        userId: currentUser.id,
        spotId: spot.id,
      },
    });

    /*
     * スタンプ数はフロントから受け取らず、
     * DBに保存されている件数から再計算する。
     */
    const stampCount = await prisma.stampLog.count({
      where: {
        userId: currentUser.id,
      },
    });

    const { level, title } = calculateLevel(stampCount);

    const stampLogs = await prisma.stampLog.findMany({
      where: {
        userId: currentUser.id,
      },
      include: {
        spot: true,
      },
      orderBy: {
        visitedAt: "asc",
      },
    });

    const visitedSpots = stampLogs.map(
      (log) => log.spot.spotName
    );

    const interestTags = stampLogs
      .map((log) => log.spot.interestTag)
      .filter(
        (tag): tag is string =>
          tag !== null &&
          tag !== undefined &&
          tag !== ""
      );

    const interestTagCounts =
      interestTags.reduce<Record<string, number>>(
        (acc, tag) => {
          acc[tag] = (acc[tag] ?? 0) + 1;
          return acc;
        },
        {}
      );

    const topInterestTags = Object.entries(
      interestTagCounts
    )
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 3);

    const spots = await prisma.spot.findMany({
      select: {
        spotName: true,
        floor: true,
        x: true,
        y: true,
        color: true,
        icon: true,
        ratingDisplayName: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log("興味タグ", topInterestTags);
    console.log("visitedSpots", visitedSpots);
    console.log(
      "spots",
      spots.map((item) => item.spotName)
    );

    const currentNft = await prisma.nFT.findUnique({
      where: {
        userId: currentUser.id,
      },
    });

    if (!currentNft) {
      return NextResponse.json(
        {
          message: "NFT情報が見つかりません",
        },
        {
          status: 404,
        }
      );
    }

    const favoriteLabs =
      await prisma.spotRating.findMany({
        where: {
          userId: currentUser.id,
        },
        include: {
          spot: true,
        },
        orderBy: [
          {
            rating: "desc",
          },
          {
            updatedAt: "desc",
          },
        ],
        take: 3,
      });

    const favoriteLabsForDnft = favoriteLabs.map(
      (item) => ({
        spotName:
          item.spot.ratingDisplayName ??
          item.spot.spotName,
        rating: item.rating,
      })
    );

    const pngBuffer = await generatePassportPng({
      level,
      title,
      stampCount,
      spots,
      visitedSpots,
      interestTags: topInterestTags,
      favoriteLabs: favoriteLabsForDnft,
    });

    const cid = await uploadPngToPinata(
      pngBuffer,
      `${currentNft.nftId}-level-${level}-${Date.now()}.png`
    );

    const imageUrl = `ipfs://${cid}`;

    const dnftMetadata = buildDnftMetadata({
      nftId: currentNft.nftId,
      level,
      title,
      stampCount,
      visitedSpots,
      interestTags: topInterestTags,
      favoriteLabs: favoriteLabsForDnft,
      imageUrl,
    });

    let updatedNft = await prisma.nFT.update({
      where: {
        userId: currentUser.id,
      },
      data: {
        stampCount,
        level,
        title,
        metadataJson: JSON.stringify(dnftMetadata),
        imageUrl: dnftMetadata.image,
        metadataUpdatedAt: new Date(),
      },
    });

    let metadataTxHash: string | null = null;

    try {
      const user = await prisma.user.findUnique({
        where: {
          id: currentUser.id,
        },
        include: {
          wallet: true,
        },
      });

      if (user?.wallet) {
        const symbolMetadata = {
          nftId: currentNft.nftId,
          level,
          title,
          stampCount,
          image: imageUrl,
          interestTags: topInterestTags,
          favoriteLabs: favoriteLabsForDnft,
        };

        const result = await sendDnftMetadata({
          recipientAddress:
            user.wallet.symbolAddress,
          metadataJson:
            JSON.stringify(symbolMetadata),
        });

        metadataTxHash = result.txHash;

        updatedNft = await prisma.nFT.update({
          where: {
            userId: currentUser.id,
          },
          data: {
            metadataTxHash,
            metadataUpdatedAt: new Date(),
          },
        });
      }
    } catch (metadataError) {
      console.error(
        "Symbol Metadata送信に失敗:",
        metadataError
      );
    }

    return NextResponse.json({
      message: "スタンプを取得しました",
      spot: {
        id: spot.id,
        spotName: spot.spotName,
        floor: spot.floor,
      },
      nft: updatedNft,
      metadata: dnftMetadata,
      imageCid: cid,
      imageUrl,
      metadataTxHash,
    });
  } catch (error) {
    /*
     * requireUser()が未認証時に
     * Error("UNAUTHORIZED")を投げるため、401へ変換する。
     */
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          message:
            "認証されていません。もう一度認証してください。",
        },
        {
          status: 401,
        }
      );
    }

    console.error("スタンプ取得エラー:", error);

    return NextResponse.json(
      {
        message: "スタンプ取得に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}