import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    /*
     * URLのuserIdではなく、
     * oc_session Cookieから現在のユーザーを取得する。
     */
    const currentUser = await requireUser();

    const user = await prisma.user.findUnique({
      where: {
        id: currentUser.id,
      },
      include: {
        wallet: true,
        nft: true,
        stampLogs: {
          include: {
            spot: true,
          },
          orderBy: {
            visitedAt: "desc",
          },
        },
        spotRatings: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "ユーザーが見つかりません",
        },
        {
          status: 404,
        }
      );
    }

    const spots = await prisma.spot.findMany({
      orderBy: [
        {
          floor: "desc",
        },
        {
          spotName: "asc",
        },
      ],
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name || "名無し",
        email: user.email ?? "メール未登録",
      },
      wallet: user.wallet
        ? {
            symbolAddress: user.wallet.symbolAddress,
          }
        : null,
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
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          message: "ログインが必要です",
        },
        {
          status: 401,
        }
      );
    }

    console.error(
      "Passport情報の取得に失敗しました:",
      error
    );

    return NextResponse.json(
      {
        message: "Passport情報の取得に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}