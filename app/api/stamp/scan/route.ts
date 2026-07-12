import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDnftMetadata } from "@/lib/dnftMetadata";
import { sendDnftMetadata } from "@/lib/symbolMetadata";
import { generatePassportPng } from "@/lib/dnft/generatePassportPng";
import { uploadPngToPinata } from "@/lib/ipfs/uploadToPinata";


function calculateLevel(stampCount: number) {
  if (stampCount >= 7) return { level: 4, title: "Campus Ambassador" };
  if (stampCount >= 5) return { level: 3, title: "Campus Member" };
  if (stampCount >= 3) return { level: 2, title: "Research Supporter" };
  if (stampCount >= 1) return { level: 1, title: "Explorer" };

  return { level: 0, title: "Beginner" };
}

export async function POST(req: Request) {
  try {
    const { userId, qrSecretCode } = await req.json();

    if (!userId || !qrSecretCode) {
      return NextResponse.json(
        { message: "userIdとqrSecretCodeが必要です" },
        { status: 400 }
      );
    }

    const userIdNumber = Number(userId);

    const spot = await prisma.spot.findUnique({
      where: { qrSecretCode },
    });

    if (!spot) {
      return NextResponse.json(
        { message: "無効なQRコードです" },
        { status: 404 }
      );
    }

    const existingLog = await prisma.stampLog.findUnique({
      where: {
        userId_spotId: {
          userId: userIdNumber,
          spotId: spot.id,
        },
      },
    });

    if (existingLog) {
      return NextResponse.json(
        { message: "このスタンプは既に取得済みです" },
        { status: 400 }
      );
    }

    await prisma.stampLog.create({
      data: {
        userId: userIdNumber,
        spotId: spot.id,
      },
    });

    const stampCount = await prisma.stampLog.count({
      where: { userId: userIdNumber },
    });

    const { level, title } = calculateLevel(stampCount);

    const stampLogs = await prisma.stampLog.findMany({
      where: { userId: userIdNumber },
      include: {
        spot: true,
      },
      orderBy: {
        visitedAt: "asc",
      },
    });
 
  const visitedSpots = stampLogs.map((log) => log.spot.spotName);

  const interestTags = stampLogs
    .map((log) => log.spot.interestTag)
    .filter(
      (tag): tag is string =>
        tag !== null &&
        tag !== undefined &&
        tag !== ""
    );

  const interestTagCounts = interestTags.reduce<Record<string, number>>(
    (acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const topInterestTags = Object.entries(interestTagCounts)
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
  spots.map((s) => s.spotName)
);
    
      
    

    const currentNft = await prisma.nFT.findUnique({
      where: {
        userId: userIdNumber,
      },
    });

    if (!currentNft) {
      return NextResponse.json(
        { message: "NFT情報が見つかりません" },
        { status: 404 }
      );
    }


    const favoriteLabs = await prisma.spotRating.findMany({
      where: {
        userId: userIdNumber,
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
    const favoriteLabsForDnft = favoriteLabs.map((item) => ({
      spotName:
        item.spot.ratingDisplayName ??
        item.spot.spotName,
      rating: item.rating,
    }));

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
      `${currentNft.nftId}-level-${level}-${level}-${Date.now()}.png`
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
        userId: userIdNumber,
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
        where: { id: userIdNumber },
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
          recipientAddress: user.wallet.symbolAddress,
          metadataJson: JSON.stringify(symbolMetadata),
        });

        metadataTxHash = result.txHash;

        updatedNft = await prisma.nFT.update({
          where: {
            userId: userIdNumber,
          },
          data: {
            metadataTxHash,
            metadataUpdatedAt: new Date(),
          },
        });
      }
    } catch (metadataError) {
      console.error("Symbol Metadata送信に失敗:", metadataError);
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
    console.error(error);
    return NextResponse.json(
      { message: "スタンプ取得に失敗しました" },
      { status: 500 }
    );
  }
}