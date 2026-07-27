import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const sessionUser = await requireUser();

    const body = await req.json();
    const { messageId, emoji } = body;

    const messageIdNumber = Number(messageId);
    const emojiText = String(emoji ?? "").trim();

    if (!messageIdNumber || !Number.isInteger(messageIdNumber) || !emojiText) {
      return NextResponse.json(
        { message: "messageIdとemojiが必要です" },
        { status: 400 }
      );
    }

    const allowedEmojis = ["👍", "❤️", "👏"];

    if (!allowedEmojis.includes(emojiText)) {
      return NextResponse.json(
        { message: "使用できないリアクションです" },
        { status: 400 }
      );
    }

    const message = await prisma.chatMessage.findUnique({
      where: {
        id: messageIdNumber,
      },
      include: {
        room: true,
      },
    });

    if (!message || message.isDeleted) {
      return NextResponse.json(
        { message: "メッセージが見つかりません" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: sessionUser.id,
      },
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

    if (message.room.roomType === "spot") {
      if (!message.room.spotId) {
        return NextResponse.json(
          { message: "研究室チャットの設定が不正です" },
          { status: 400 }
        );
      }

      const visited = await prisma.stampLog.findUnique({
        where: {
          userId_spotId: {
            userId: sessionUser.id,
            spotId: message.room.spotId,
          },
        },
      });

      if (!visited && !user.isAdmin) {
        return NextResponse.json(
          { message: "この研究室を訪問した参加者のみ利用できます" },
          { status: 403 }
        );
      }
    }

    const existing = await prisma.chatReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: messageIdNumber,
          userId: sessionUser.id,
          emoji: emojiText,
        },
      },
    });

    if (existing) {
      await prisma.chatReaction.delete({
        where: {
          id: existing.id,
        },
      });

      return NextResponse.json({
        message: "リアクションを取り消しました",
      });
    }

    const reaction = await prisma.chatReaction.create({
      data: {
        messageId: messageIdNumber,
        userId: sessionUser.id,
        emoji: emojiText,
      },
    });

    return NextResponse.json({
      message: "リアクションしました",
      reaction,
    });
  } catch (error) {
    console.error("リアクション処理エラー:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "ログインが必要です" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "リアクションに失敗しました" },
      { status: 500 }
    );
  }
}