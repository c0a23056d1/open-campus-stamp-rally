import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const sessionUser = await requireUser();

    const user = await prisma.user.findUnique({
      where: {
        id: sessionUser.id,
      },
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

    const now = new Date();

    const proposals = await prisma.proposal.findMany({
      where: {
        status: "approved",
        endAt: {
          gte: now,
        },
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
  } catch (error) {
    console.error("Proposal一覧取得エラー:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "ログインが必要です" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Proposal一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}