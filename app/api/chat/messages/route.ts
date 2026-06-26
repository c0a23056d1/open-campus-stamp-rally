import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get("userId"));
    const roomId = Number(searchParams.get("roomId"));

    if (!userId || !roomId) {
      return NextResponse.json(
        { message: "userIdとroomIdが必要です" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        nft: true,
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

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
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
        isDeleted: false,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
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
      { message: "チャット取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId, roomId, messageText } = await req.json();

    if (!userId || !roomId || !messageText) {
      return NextResponse.json(
        { message: "userId、roomId、messageTextが必要です" },
        { status: 400 }
      );
    }

    const userIdNumber = Number(userId);
    const roomIdNumber = Number(roomId);
    const trimmedMessage = String(messageText).trim();

    if (!trimmedMessage) {
      return NextResponse.json(
        { message: "メッセージを入力してください" },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 300) {
      return NextResponse.json(
        { message: "メッセージは300文字以内にしてください" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdNumber },
      include: {
        nft: true,
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
        { message: "チャット投稿はLevel 1以上で利用できます" },
        { status: 403 }
      );
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomIdNumber },
    });

    if (!room) {
      return NextResponse.json(
        { message: "チャットルームが見つかりません" },
        { status: 404 }
      );
    }

    const created = await prisma.chatMessage.create({
      data: {
        roomId: roomIdNumber,
        userId: userIdNumber,
        messageText: trimmedMessage,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "投稿しました",
      chatMessage: created,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "チャット投稿に失敗しました" },
      { status: 500 }
    );
  }
}