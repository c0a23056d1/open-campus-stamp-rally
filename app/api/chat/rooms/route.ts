import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const sessionUser = await requireUser();

    const user = await prisma.user.findUnique({
      where: {
        id: sessionUser.id,
      },
      include: {
        nft: true,
        stampLogs: {
          select: {
            spotId: true,
          },
        },
      },
    });

    if (!user || !user.nft) {
      return NextResponse.json(
        { message: "ユーザー情報が見つかりません" },
        { status: 404 }
      );
    }

    if (user.nft.level < 1 && !user.isAdmin) {
      return NextResponse.json(
        { message: "チャットはLevel 1以上で利用できます" },
        { status: 403 }
      );
    }

    const visitedSpotIds = user.stampLogs.map((log) => log.spotId);

    const rooms = await prisma.chatRoom.findMany({
      where: user.isAdmin
        ? undefined
        : {
            OR: [
              {
                roomType: {
                  in: ["general", "proposal"],
                },
              },
              {
                roomType: "spot",
                spotId: {
                  in: visitedSpotIds,
                },
              },
            ],
          },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        messages: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
          },
        },
        spot: true,
      },
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("チャットルーム取得エラー:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "ログインが必要です" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "チャットルーム取得に失敗しました" },
      { status: 500 }
    );
  }
}