import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return !!user?.isAdmin;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get("userId"));

  if (!(await checkAdmin(userId))) {
    return NextResponse.json(
      { message: "管理者権限がありません" },
      { status: 403 }
    );
  }

  const spots = await prisma.spot.findMany({
    orderBy: { id: "desc" },
  });

  return NextResponse.json({ spots });
}

export async function POST(req: Request) {
  const { userId, spotName, floor, description } = await req.json();

  if (!(await checkAdmin(Number(userId)))) {
    return NextResponse.json(
      { message: "管理者権限がありません" },
      { status: 403 }
    );
  }

  const qrSecretCode = `spot_${crypto.randomBytes(16).toString("hex")}`;

  const spot = await prisma.spot.create({
    data: {
      spotName,
      floor,
      description,
      qrSecretCode,
    },
  });

  return NextResponse.json({
    message: "スポットを登録しました",
    spot,
  });
}