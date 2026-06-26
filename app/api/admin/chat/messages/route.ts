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
    const roomId = Number(searchParams.get("roomId"));

    if (!adminUserId || !roomId) {
      return NextResponse.json(
        { message: "adminUserIdとroomIdが必要です" },
        { status: 400 }
      );
    }

    if (!(await checkAdmin(adminUserId))) {
      return NextResponse.json(
        { message: "管理者権限がありません" },
        { status: 403 }
      );
    }

    const room = await prisma.chatRoom.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room) {
      return NextResponse.json(
        { message: "チャットルームが見つかりません" },
        { status: 404 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      room,
      messages,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "メッセージ一覧取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { adminUserId, messageId } = await req.json();

    if (!adminUserId || !messageId) {
      return NextResponse.json(
        { message: "adminUserIdとmessageIdが必要です" },
        { status: 400 }
      );
    }

    if (!(await checkAdmin(Number(adminUserId)))) {
      return NextResponse.json(
        { message: "管理者権限がありません" },
        { status: 403 }
      );
    }

    const message = await prisma.chatMessage.findUnique({
      where: {
        id: Number(messageId),
      },
    });

    if (!message) {
      return NextResponse.json(
        { message: "メッセージが見つかりません" },
        { status: 404 }
      );
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: {
        id: Number(messageId),
      },
      data: {
        isDeleted: true,
      },
    });

    return NextResponse.json({
      message: "メッセージを削除しました",
      chatMessage: updatedMessage,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "メッセージ削除に失敗しました" },
      { status: 500 }
    );
  }
}