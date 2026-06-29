import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return !!user?.isAdmin;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminUserId = Number(searchParams.get("adminUserId"));

    if (!adminUserId) {
      return NextResponse.json(
        { message: "adminUserIdが必要です" },
        { status: 400 }
      );
    }

    if (!(await checkAdmin(adminUserId))) {
      return NextResponse.json(
        { message: "管理者権限がありません" },
        { status: 403 }
      );
    }

    const rooms = await prisma.chatRoom.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "チャットルーム一覧取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { adminUserId, roomName, description } = await req.json();

    if (!adminUserId || !roomName) {
      return NextResponse.json(
        { message: "adminUserIdとroomNameが必要です" },
        { status: 400 }
      );
    }

    if (!(await checkAdmin(Number(adminUserId)))) {
      return NextResponse.json(
        { message: "管理者権限がありません" },
        { status: 403 }
      );
    }

    const trimmedRoomName = String(roomName).trim();
    const trimmedDescription = description
      ? String(description).trim()
      : null;

    if (!trimmedRoomName) {
      return NextResponse.json(
        { message: "ルーム名を入力してください" },
        { status: 400 }
      );
    }

    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        roomName: trimmedRoomName,
      },
    });

    if (existingRoom) {
      return NextResponse.json(
        { message: "同じ名前のチャットルームが既に存在します" },
        { status: 400 }
      );
    }

    const room = await prisma.chatRoom.create({
      data: {
        roomName: trimmedRoomName,
        description: trimmedDescription,
      },
    });

    return NextResponse.json({
      message: "チャットルームを作成しました",
      room,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "チャットルーム作成に失敗しました" },
      { status: 500 }
    );
  }
}