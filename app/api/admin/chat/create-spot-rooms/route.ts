import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return !!user?.isAdmin;
}

export async function POST(req: Request) {
  try {
    const { adminUserId } = await req.json();

    if (!adminUserId) {
      return NextResponse.json(
        { message: "adminUserIdが必要です" },
        { status: 400 }
      );
    }

    if (!(await checkAdmin(Number(adminUserId)))) {
      return NextResponse.json(
        { message: "管理者権限がありません" },
        { status: 403 }
      );
    }

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

      if (existingRoom) continue;

      await prisma.chatRoom.create({
        data: {
          roomName: `${spot.floor} ${spot.spotName} コミュニティ`,
          description: `${spot.spotName}を訪問した参加者が交流できるチャットです。`,
          roomType: "spot",
          spotId: spot.id,
        },
      });

      createdCount++;
    }

    return NextResponse.json({
      message: `${createdCount}件の研究室コミュニティチャットを作成しました`,
      createdCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "研究室チャット作成に失敗しました" },
      { status: 500 }
    );
  }
}