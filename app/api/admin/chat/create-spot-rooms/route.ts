import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    await requireAdmin();

    const spots = await prisma.spot.findMany({
      include: {
        chatRooms: true,
      },
    });

    let createdCount = 0;

    for (const spot of spots) {
      const existingRoom = spot.chatRooms.find(
        (room) => room.roomType === "spot"
      );

      if (existingRoom) {
        continue;
      }

      await prisma.chatRoom.create({
        data: {
          roomName:
            `${spot.floor} ${spot.spotName} コミュニティ`,
          description:
            `${spot.spotName}を訪問した参加者が交流できるチャットです。`,
          roomType: "spot",
          spotId: spot.id,
        },
      });

      createdCount++;
    }

    return NextResponse.json({
      message:
        `${createdCount}件の研究室コミュニティチャットを作成しました`,
      createdCount,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { message: "ログインが必要です" },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        { message: "管理者権限がありません" },
        { status: 403 }
      );
    }

    console.error("研究室チャット作成エラー:", error);

    return NextResponse.json(
      { message: "研究室チャット作成に失敗しました" },
      { status: 500 }
    );
  }
}