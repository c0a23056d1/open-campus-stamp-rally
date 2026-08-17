import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const sessionUser = await requireUser();

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

    if (user.nft.level < 3 && !user.isAdmin) {
      return NextResponse.json(
        { message: "Proposal提案はLevel 3以上で利用できます" },
        { status: 403 }
      );
    }

    const requiredLevelNumber = Number(requiredLevel);
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (
      !Number.isInteger(requiredLevelNumber) ||
      requiredLevelNumber < 1 ||
      requiredLevelNumber > 4
    ) {
      return NextResponse.json(
        { message: "必要Levelの指定が不正です" },
        { status: 400 }
      );
    }

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
        { message: "終了日時は開始日時より後に設定してください" },
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

    const proposal = await prisma.proposal.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        requiredLevel: requiredLevelNumber,
        startAt: startDate,
        endAt: endDate,
        creatorUserId: sessionUser.id,
        status: "pending",
        options: {
          create: optionLabels.map((label, index) => ({
            label,
            sortOrder: index,
          })),
        },
      },
      include: {
        options: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Proposal案を送信しました。管理者の承認後に公開されます。",
      proposal,
    });
  } catch (error) {
    console.error("Proposal提案エラー:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "ログインが必要です" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Proposal提案に失敗しました" },
      { status: 500 }
    );
  }
}