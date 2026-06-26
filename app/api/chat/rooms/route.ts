import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json(
        { message: "userIdが必要です" },
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

    const rooms = await prisma.chatRoom.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        messages: {
          where: {
            isDeleted: false,
          },
        },
      },
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "チャットルーム取得に失敗しました" },
      { status: 500 }
    );
  }
}