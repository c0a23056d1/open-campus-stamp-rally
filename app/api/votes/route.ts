import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { sendDaoEvent } from "@/lib/symbol/symbolDao";

export async function POST(req: Request) {
  try {
    const sessionUser = await requireUser();

    const { proposalId, proposalOptionId } = await req.json();

    const proposalIdNumber = Number(proposalId);
    const proposalOptionIdNumber = Number(proposalOptionId);

    if (
      !proposalIdNumber ||
      !proposalOptionIdNumber ||
      !Number.isInteger(proposalIdNumber) ||
      !Number.isInteger(proposalOptionIdNumber)
    ) {
      return NextResponse.json(
        { message: "proposalIdとproposalOptionIdが必要です" },
        { status: 400 }
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

    const proposal = await prisma.proposal.findUnique({
      where: {
        id: proposalIdNumber,
      },
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

    if (proposal.status !== "approved") {
      return NextResponse.json(
        { message: "このProposalには投票できません" },
        { status: 403 }
      );
    }

    const option = proposal.options.find(
      (item) => item.id === proposalOptionIdNumber
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

    if (user.nft.level < proposal.requiredLevel && !user.isAdmin) {
      return NextResponse.json(
        {
          message: `この投票にはLevel ${proposal.requiredLevel}以上が必要です`,
        },
        { status: 403 }
      );
    }

    const existingVote = await prisma.vote.findFirst({
      where: {
        userId: sessionUser.id,
        proposalId: proposalIdNumber,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { message: "このProposalにはすでに投票しています" },
        { status: 409 }
      );
    }

    const vote = await prisma.vote.create({
      data: {
        userId: sessionUser.id,
        proposalId: proposalIdNumber,
        proposalOptionId: proposalOptionIdNumber,
      },
    });

    let voteTxHash: string | null = null;

    try {
      const result = await sendDaoEvent({
        eventType: "VOTE_CAST",
        proposalId: proposal.id,
        title: proposal.title,
        status: "voted",
        actorUserId: sessionUser.id,
        optionId: proposalOptionIdNumber,
        optionLabel: option.label,
        actorLevel: user.nft.level,
      });

      voteTxHash = result.txHash;
    } catch (symbolError) {
      console.error("DAOイベント送信に失敗しました:", symbolError);
    }

    const updatedVote = await prisma.vote.update({
      where: {
        id: vote.id,
      },
      data: {
        voteTxHash,
        recordedAt: voteTxHash ? new Date() : null,
      },
    });

    return NextResponse.json({
      message: voteTxHash
        ? "投票し、Symbolに記録しました"
        : "投票しましたが、Symbolへの記録に失敗しました",
      vote: updatedVote,
      voteTxHash,
    });
  } catch (error) {
    console.error("投票処理エラー:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "ログインが必要です" },
        { status: 401 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "このProposalにはすでに投票しています" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "投票中にエラーが発生しました" },
      { status: 500 }
    );
  }
}