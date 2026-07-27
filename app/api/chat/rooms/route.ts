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

    const now = new Date();

    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          {
            roomType: "general",
          },
          {
            roomType: "spot",
            spotId: user.isAdmin
              ? undefined
              : {
                  in: visitedSpotIds,
                },
          },
          {
            roomType: "proposal",
            proposals: {
              some: {
                status: "approved",
                endAt: {
                  gte: now,
                },
              },
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
        proposals: true,
      },
    });

    console.log(
      rooms.map((room) => ({
        roomId: room.id,
        roomName: room.roomName,
        roomType: room.roomType,
        proposals: room.proposals.map((proposal) => ({
          id: proposal.id,
          title: proposal.title,
          endAt: proposal.endAt,
          expired: proposal.endAt < now,
        })),
      }))
    );

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