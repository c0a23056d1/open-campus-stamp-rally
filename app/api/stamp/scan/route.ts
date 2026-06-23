import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calculateLevel(stampCount: number) {
  if (stampCount >= 10) {
    return { level: 4, title: "Campus Ambassador" };
  }
  if (stampCount >= 7) {
    return { level: 3, title: "Campus Member" };
  }
  if (stampCount >= 4) {
    return { level: 2, title: "Research Supporter" };
  }
  if (stampCount >= 1) {
    return { level: 1, title: "Explorer" };
  }

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

    // 1. Spotを特定
    const spot = await prisma.spot.findUnique({
      where: {
        qrSecretCode,
      },
    });

    if (!spot) {
      return NextResponse.json(
        { message: "無効なQRコードです" },
        { status: 404 }
      );
    }

    // 2. 同じスポットを既に取得していないか確認
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

    // 3. StampLog保存
    await prisma.stampLog.create({
      data: {
        userId: userIdNumber,
        spotId: spot.id,
      },
    });

    // 4. スタンプ数を再計算
    const stampCount = await prisma.stampLog.count({
      where: {
        userId: userIdNumber,
      },
    });

    // 5. レベル計算
    const { level, title } = calculateLevel(stampCount);

    // 6. NFTテーブル更新
    const nft = await prisma.nFT.update({
      where: {
        userId: userIdNumber,
      },
      data: {
        stampCount,
        level,
        title,
      },
    });

    return NextResponse.json({
      message: "スタンプを取得しました",
      spot: {
        id: spot.id,
        spotName: spot.spotName,
        floor: spot.floor,
      },
      nft,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "スタンプ取得に失敗しました" },
      { status: 500 }
    );
  }
}