import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();

    const rooms = await prisma.chatRoom.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ rooms });
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

    console.error("チャットルーム一覧取得エラー:", error);

    return NextResponse.json(
      { message: "チャットルーム一覧取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { roomName, description } = await req.json();

    const trimmedRoomName =
      typeof roomName === "string" ? roomName.trim() : "";

    const trimmedDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
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
        {
          message:
            "同じ名前のチャットルームが既に存在します",
        },
        { status: 409 }
      );
    }

    const room = await prisma.chatRoom.create({
      data: {
        roomName: trimmedRoomName,
        description: trimmedDescription,
      },
    });

    return NextResponse.json(
      {
        message: "チャットルームを作成しました",
        room,
      },
      { status: 201 }
    );
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

    console.error("チャットルーム作成エラー:", error);

    return NextResponse.json(
      { message: "チャットルーム作成に失敗しました" },
      { status: 500 }
    );
  }
}