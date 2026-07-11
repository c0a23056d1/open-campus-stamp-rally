import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, spotId, rating, comment } = await req.json();

    if (!userId || !spotId || !rating) {
      return NextResponse.json(
        { message: "userId, spotId, ratingが必要です" },
        { status: 400 }
      );
    }

    const ratingNumber = Number(rating);

    if (ratingNumber < 1 || ratingNumber > 5) {
      return NextResponse.json(
        { message: "評価は1〜5で入力してください" },
        { status: 400 }
      );
    }

    const visited = await prisma.stampLog.findUnique({
      where: {
        userId_spotId: {
          userId: Number(userId),
          spotId: Number(spotId),
        },
      },
    });

    if (!visited) {
      return NextResponse.json(
        { message: "訪問していない研究室は評価できません" },
        { status: 403 }
      );
    }

    const spotRating = await prisma.spotRating.upsert({
      where: {
        userId_spotId: {
          userId: Number(userId),
          spotId: Number(spotId),
        },
      },
      update: {
        rating: ratingNumber,
        comment: comment ?? null,
      },
      create: {
        userId: Number(userId),
        spotId: Number(spotId),
        rating: ratingNumber,
        comment: comment ?? null,
      },
    });

    return NextResponse.json({
      message: "研究室評価を保存しました",
      spotRating,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "研究室評価の保存に失敗しました" },
      { status: 500 }
    );
  }
}