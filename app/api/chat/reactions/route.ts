import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, messageId, emoji } = await req.json();

    if (!userId || !messageId || !emoji) {
      return NextResponse.json(
        { message: "userId、messageId、emojiが必要です" },
        { status: 400 }
      );
    }

    const existing = await prisma.chatReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: Number(messageId),
          userId: Number(userId),
          emoji: String(emoji),
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
        messageId: Number(messageId),
        userId: Number(userId),
        emoji: String(emoji),
      },
    });

    return NextResponse.json({
      message: "リアクションしました",
      reaction,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "リアクションに失敗しました" },
      { status: 500 }
    );
  }
}