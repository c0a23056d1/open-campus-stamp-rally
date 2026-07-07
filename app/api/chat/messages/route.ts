import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function canAccessRoom({
  userId,
  roomId,
}: {
  userId: number;
  roomId: number;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      nft: true,
    },
  });

  if (!user || !user.nft) {
    return {
      ok: false,
      status: 404,
      message: "ユーザー情報が見つかりません",
      user: null,
      room: null,
    };
  }

  if (user.nft.level < 1 && !user.isAdmin) {
    return {
      ok: false,
      status: 403,
      message: "チャットはLevel 1以上で利用できます",
      user,
      room: null,
    };
  }

  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      spot: true,
    },
  });

  if (!room) {
    return {
      ok: false,
      status: 404,
      message: "チャットルームが見つかりません",
      user,
      room: null,
    };
  }

  if (room.roomType === "spot") {
    if (!room.spotId) {
      return {
        ok: false,
        status: 400,
        message: "研究室チャットの設定が不正です",
        user,
        room,
      };
    }

    const visited = await prisma.stampLog.findUnique({
      where: {
        userId_spotId: {
          userId,
          spotId: room.spotId,
        },
      },
    });

    if (!visited && !user.isAdmin) {
      return {
        ok: false,
        status: 403,
        message: "この研究室を訪問した参加者のみ利用できます",
        user,
        room,
      };
    }
  }

  return {
    ok: true,
    status: 200,
    message: "OK",
    user,
    room,
  };
}

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

    const access = await canAccessRoom({ userId, roomId });

    if (!access.ok) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status }
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
        replyToMessage: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        reactions: true,
      },
    });

    return NextResponse.json({
      room: access.room,
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
    const { userId, roomId, messageText, replyToMessageId } = await req.json();

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

    const access = await canAccessRoom({
      userId: userIdNumber,
      roomId: roomIdNumber,
    });

    if (!access.ok) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status }
      );
    }

    const created = await prisma.chatMessage.create({
      data: {
        roomId: roomIdNumber,
        userId: userIdNumber,
        messageText: trimmedMessage,
        replyToMessageId: replyToMessageId ? Number(replyToMessageId) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        replyToMessage: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        reactions: true,
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