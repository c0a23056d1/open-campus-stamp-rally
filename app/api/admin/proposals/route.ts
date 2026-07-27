import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();

    const proposals = await prisma.proposal.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    return NextResponse.json({ proposals });
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

    console.error("Proposal一覧取得エラー:", error);

    return NextResponse.json(
      { message: "Proposal一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const {
      title,
      description,
      requiredLevel,
      startAt,
      endAt,
      options,
    } = await req.json();

    if (!title || !description || !startAt || !endAt) {
      return NextResponse.json(
        { message: "必要な項目が不足しています" },
        { status: 400 }
      );
    }

    const requiredLevelNumber = Number(requiredLevel);

    if (
      !Number.isInteger(requiredLevelNumber) ||
      requiredLevelNumber < 0
    ) {
      return NextResponse.json(
        { message: "必要レベルが不正です" },
        { status: 400 }
      );
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        { message: "開始日時または終了日時が不正です" },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { message: "終了日時は開始日時より後にしてください" },
        { status: 400 }
      );
    }

    const optionLabels = Array.isArray(options)
      ? options
          .map((option) => String(option).trim())
          .filter((option) => option.length > 0)
      : [];

    if (optionLabels.length < 2) {
      return NextResponse.json(
        { message: "選択肢は2つ以上必要です" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const chatRoom = await tx.chatRoom.create({
        data: {
          roomName: `${title} 議論ルーム`,
          description:
            `このチャットルームは、提案「${title}」の議論用です。`,
        },
      });

      const proposal = await tx.proposal.create({
        data: {
          title,
          description,
          requiredLevel: requiredLevelNumber,
          startAt: startDate,
          endAt: endDate,
          chatRoomId: chatRoom.id,
          options: {
            create: optionLabels.map((label, index) => ({
              label,
              sortOrder: index,
            })),
          },
        },
        include: {
          options: true,
          chatRoom: true,
        },
      });

      return proposal;
    });

    return NextResponse.json(
      {
        message: "Proposalを作成しました",
        proposal: result,
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

    console.error("Proposal作成エラー:", error);

    return NextResponse.json(
      { message: "Proposal作成に失敗しました" },
      { status: 500 }
    );
  }
}