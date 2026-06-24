import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDnftMetadata } from "@/lib/dnftMetadata";
import { sendDnftMetadata } from "@/lib/symbolMetadata";

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

    const dnftMetadata = buildDnftMetadata({
      nftId: currentNft.nftId,
      level,
      title,
      stampCount,
      visitedSpots,
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
        const result = await sendDnftMetadata({
          recipientAddress: user.wallet.symbolAddress,
          metadataJson: JSON.stringify(dnftMetadata),
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