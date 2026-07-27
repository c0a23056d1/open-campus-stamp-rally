import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

async function canAccessRoom({
  userId,
  roomId,
}: {
  userId: number;
  roomId: number;
}) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      nft: true,
    },
  });

  if (!user || !user.nft) {
    return {
      ok: false as const,
      status: 404,
      message: "ユーザー情報が見つかりません",
      user: null,
      room: null,
    };
  }

  if (user.nft.level < 1 && !user.isAdmin) {
    return {
      ok: false as const,
      status: 403,
      message: "チャットはLevel 1以上で利用できます",
      user,
      room: null,
    };
  }

  const room = await prisma.chatRoom.findUnique({
    where: {
      id: roomId,
    },
    include: {
      spot: true,
    },
  });

  if (!room) {
    return {
      ok: false as const,
      status: 404,
      message: "チャットルームが見つかりません",
      user,
      room: null,
    };
  }

  if (room.roomType === "spot") {
    if (!room.spotId) {
      return {
        ok: false as const,
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
        ok: false as const,
        status: 403,
        message: "この研究室を訪問した参加者のみ利用できます",
        user,
        room,
      };
    }
  }

  return {
    ok: true as const,
    status: 200,
    message: "OK",
    user,
    room,
  };
}

export async function GET(req: Request) {
  try {
    const sessionUser = await requireUser();

    const { searchParams } = new URL(req.url);
    const roomId = Number(searchParams.get("roomId"));

    if (!roomId || !Number.isInteger(roomId)) {
      return NextResponse.json(
        { message: "正しいroomIdが必要です" },
        { status: 400 }
      );
    }

    const access = await canAccessRoom({
      userId: sessionUser.id,
      roomId,
    });

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
      currentUserId: sessionUser.id,
    });
  } catch (error) {
    console.error("チャット取得エラー:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "ログインが必要です" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "チャット取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await requireUser();

    const body = await req.json();
    const { roomId, messageText, replyToMessageId } = body;

    const roomIdNumber = Number(roomId);
    const trimmedMessage = String(messageText ?? "").trim();

    if (!roomIdNumber || !Number.isInteger(roomIdNumber)) {
      return NextResponse.json(
        { message: "正しいroomIdが必要です" },
        { status: 400 }
      );
    }

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
      userId: sessionUser.id,
      roomId: roomIdNumber,
    });

    if (!access.ok) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status }
      );
    }

    let replyToId: number | null = null;

    if (replyToMessageId !== null && replyToMessageId !== undefined) {
      replyToId = Number(replyToMessageId);

      if (!replyToId || !Number.isInteger(replyToId)) {
        return NextResponse.json(
          { message: "返信先メッセージの指定が不正です" },
          { status: 400 }
        );
      }

      const replyTarget = await prisma.chatMessage.findFirst({
        where: {
          id: replyToId,
          roomId: roomIdNumber,
          isDeleted: false,
        },
        select: {
          id: true,
        },
      });

      if (!replyTarget) {
        return NextResponse.json(
          { message: "返信先メッセージが見つかりません" },
          { status: 404 }
        );
      }
    }

    const created = await prisma.chatMessage.create({
      data: {
        roomId: roomIdNumber,
        userId: sessionUser.id,
        messageText: trimmedMessage,
        replyToMessageId: replyToId,
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
    console.error("チャット投稿エラー:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "ログインが必要です" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "チャット投稿に失敗しました" },
      { status: 500 }
    );
  }
}