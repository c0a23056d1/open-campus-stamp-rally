import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json(
        { message: "userIdが必要です" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        nft: true,
        stampLogs: {
          include: {
            spot: true,
          },
        },
        spotRatings: true,
      },
    });

    const spots = await prisma.spot.findMany({
      orderBy: [{ floor: "desc" }, { spotName: "asc" }],
    });

    if (!user) {
      return NextResponse.json(
        { message: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      wallet: user.wallet,
      nft: user.nft,
      stamps: user.stampLogs.map((log) => ({
        id: log.id,
        spotId: log.spotId,
        visitedAt: log.visitedAt,
        spotName: log.spot.spotName,
        floor: log.spot.floor,
      })),
      spotRatings: user.spotRatings.map((rating) => ({
        id: rating.id,
        spotId: rating.spotId,
        rating: rating.rating,
        comment: rating.comment,
      })),
      spots: spots.map((spot) => ({
        spotName: spot.spotName,
        floor: spot.floor,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Passport情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}