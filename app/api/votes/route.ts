import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, proposalId, proposalOptionId } = await req.json();

    if (!userId || !proposalId || !proposalOptionId) {
      return NextResponse.json(
        { message: "userId、proposalId、proposalOptionIdが必要です" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
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

    const proposal = await prisma.proposal.findUnique({
      where: { id: Number(proposalId) },
      include: {
        options: true,
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { message: "Proposalが見つかりません" },
        { status: 404 }
      );
    }

    const option = proposal.options.find(
      (item) => item.id === Number(proposalOptionId)
    );

    if (!option) {
      return NextResponse.json(
        { message: "無効な選択肢です" },
        { status: 400 }
      );
    }

    const now = new Date();

    if (now < proposal.startAt) {
      return NextResponse.json(
        { message: "投票はまだ開始されていません" },
        { status: 400 }
      );
    }

    if (now > proposal.endAt) {
      return NextResponse.json(
        { message: "投票は終了しています" },
        { status: 400 }
      );
    }

    if (user.nft.level < proposal.requiredLevel) {
      return NextResponse.json(
        { message: `この投票にはLevel ${proposal.requiredLevel}以上が必要です` },
        { status: 403 }
      );
    }

    const vote = await prisma.vote.create({
      data: {
        userId: Number(userId),
        proposalId: Number(proposalId),
        proposalOptionId: Number(proposalOptionId),
      },
    });

    return NextResponse.json({
      message: "投票しました",
      vote,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "投票に失敗しました。既に投票済みの可能性があります。" },
      { status: 500 }
    );
  }
}