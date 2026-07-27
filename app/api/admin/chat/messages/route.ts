import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const roomId = Number(searchParams.get("roomId"));

    if (!Number.isInteger(roomId) || roomId <= 0) {
      return NextResponse.json(
        { message: "有効なroomIdが必要です" },
        { status: 400 }
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

    console.error("メッセージ一覧取得エラー:", error);

    return NextResponse.json(
      { message: "メッセージ一覧取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();

    const { messageId } = await req.json();
    const messageIdNumber = Number(messageId);

    if (
      !Number.isInteger(messageIdNumber) ||
      messageIdNumber <= 0
    ) {
      return NextResponse.json(
        { message: "有効なmessageIdが必要です" },
        { status: 400 }
      );
    }

    const message = await prisma.chatMessage.findUnique({
      where: {
        id: messageIdNumber,
      },
    });

    if (!message) {
      return NextResponse.json(
        { message: "メッセージが見つかりません" },
        { status: 404 }
      );
    }

    if (message.isDeleted) {
      return NextResponse.json(
        { message: "このメッセージは既に削除されています" },
        { status: 400 }
      );
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: {
        id: messageIdNumber,
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

    console.error("メッセージ削除エラー:", error);

    return NextResponse.json(
      { message: "メッセージ削除に失敗しました" },
      { status: 500 }
    );
  }
}