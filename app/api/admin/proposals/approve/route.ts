import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDaoEvent } from "@/lib/symbol/symbolDao";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();

    const { proposalId } = await req.json();

    const proposalIdNumber = Number(proposalId);

    if (
      !Number.isInteger(proposalIdNumber) ||
      proposalIdNumber <= 0
    ) {
      return NextResponse.json(
        { message: "有効なproposalIdが必要です" },
        { status: 400 }
      );
    }

    const proposal = await prisma.proposal.findUnique({
      where: {
        id: proposalIdNumber,
      },
      include: {
        chatRoom: true,
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { message: "Proposalが見つかりません" },
        { status: 404 }
      );
    }

    if (proposal.status === "approved") {
      return NextResponse.json(
        { message: "このProposalはすでに承認済みです" },
        { status: 400 }
      );
    }

    let chatRoomId = proposal.chatRoomId;

    if (!chatRoomId) {
      const chatRoom = await prisma.chatRoom.create({
        data: {
          roomName: `${proposal.title} 議論ルーム`,
          description:
            `Proposal「${proposal.title}」について話し合うためのチャットルームです。`,
        },
      });

      chatRoomId = chatRoom.id;
    }

    let approveTxHash: string | null = null;

    try {
      const result = await sendDaoEvent({
        eventType: "PROPOSAL_APPROVED",
        proposalId: proposal.id,
        title: proposal.title,
        status: "approved",
        actorUserId: admin.id,
      });

      approveTxHash = result.txHash;
    } catch (symbolError) {
      console.error(
        "DAOイベントのSymbol記録に失敗:",
        symbolError
      );
    }

    const updatedProposal = await prisma.proposal.update({
      where: {
        id: proposal.id,
      },
      data: {
        status: "approved",
        chatRoomId,
        approveTxHash,
        approvedAt: new Date(),
      },
      include: {
        chatRoom: true,
        options: true,
      },
    });

    return NextResponse.json({
      message: approveTxHash
        ? "Proposalを承認し、Symbolに記録しました"
        : "Proposalを承認しました（Symbol記録は失敗しました）",
      proposal: updatedProposal,
      approveTxHash,
    });
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

    console.error("Proposal承認エラー:", error);

    return NextResponse.json(
      { message: "Proposal承認に失敗しました" },
      { status: 500 }
    );
  }
}