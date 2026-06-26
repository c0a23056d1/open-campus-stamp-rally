import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return !!user?.isAdmin;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adminUserId = Number(searchParams.get("adminUserId"));

  if (!adminUserId) {
    return NextResponse.json(
      { message: "adminUserIdが必要です" },
      { status: 400 }
    );
  }

  if (!(await checkAdmin(adminUserId))) {
    return NextResponse.json(
      { message: "管理者権限がありません" },
      { status: 403 }
    );
  }

  const proposals = await prisma.proposal.findMany({
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

  return NextResponse.json({ proposals });
}

export async function POST(req: Request) {
  try {
    const {
      adminUserId,
      title,
      description,
      requiredLevel,
      startAt,
      endAt,
      options,
    } = await req.json();

    if (!adminUserId || !title || !description || !startAt || !endAt) {
      return NextResponse.json(
        { message: "必要な項目が不足しています" },
        { status: 400 }
      );
    }

    if (!(await checkAdmin(Number(adminUserId)))) {
      return NextResponse.json(
        { message: "管理者権限がありません" },
        { status: 403 }
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

    const chatRoom = await prisma.chatRoom.create({
      data: {
        roomName: `${title} 議論ルーム`,
        description: `このチャットルームは、提案「${title}」の議論用です。`,
      },
    });

    const proposal = await prisma.proposal.create({
      data: {
        title,
        description,
        requiredLevel: Number(requiredLevel),
        startAt: new Date(startAt),
        endAt: new Date(endAt),
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

    return NextResponse.json({
      message: "Proposalを作成しました",
      proposal,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Proposal作成に失敗しました" },
      { status: 500 }
    );
  }
}