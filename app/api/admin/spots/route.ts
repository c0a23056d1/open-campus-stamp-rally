import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();

    const spots = await prisma.spot.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json({ spots });
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

    console.error("スポット一覧取得エラー:", error);

    return NextResponse.json(
      { message: "スポット一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const {
      spotName,
      floor,
      description,
      x,
      y,
      color,
      icon,
      interestTag,
      ratingDisplayName,
    } = await req.json();

    if (!spotName || !floor) {
      return NextResponse.json(
        { message: "スポット名と階数は必須です" },
        { status: 400 }
      );
    }

    const qrSecretCode =
      `spot_${crypto.randomBytes(16).toString("hex")}`;

    const spot = await prisma.spot.create({
      data: {
        spotName,
        floor,
        description,
        qrSecretCode,
        x: Number(x),
        y: Number(y),
        color,
        icon,
        interestTag,
        ratingDisplayName,
      },
    });

    await prisma.chatRoom.create({
      data: {
        roomName:
          `${spot.floor} ${spot.spotName} コミュニティ`,
        description:
          `${spot.spotName}を訪問した参加者が交流できるチャットです。`,
        roomType: "spot",
        spotId: spot.id,
      },
    });

    return NextResponse.json(
      {
        message: "スポットを登録しました",
        spot,
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

    console.error("スポット登録エラー:", error);

    return NextResponse.json(
      { message: "スポットの登録に失敗しました" },
      { status: 500 }
    );
  }
}