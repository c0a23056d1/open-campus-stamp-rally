import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
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
      votes: true,
    },
  });

  if (!user || !user.nft) {
    return NextResponse.json(
      { message: "ユーザー情報が見つかりません" },
      { status: 404 }
    );
  }

  const proposals = await prisma.proposal.findMany({
    where: {
      status: "approved",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      chatRoom: true,
      options: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          votes: true,
        },
      },
      votes: true,
    },
  });

  return NextResponse.json({
    userLevel: user.nft.level,
    userVotes: user.votes,
    proposals,
  });
}