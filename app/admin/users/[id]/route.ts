import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const targetUserId = Number(id);

    if (
      !Number.isInteger(targetUserId) ||
      targetUserId <= 0
    ) {
      return NextResponse.json(
        {
          message: "ユーザーIDが正しくありません",
        },
        {
          status: 400,
        }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          message: "削除対象のユーザーが見つかりません",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.$transaction(async (transaction) => {
      /*
       * ChatMessageの返信関係を先に解除する。
       * 削除対象ユーザーのメッセージが、
       * 他のメッセージから返信先として参照されている可能性がある。
       */
      const targetMessages =
        await transaction.chatMessage.findMany({
          where: {
            userId: targetUserId,
          },
          select: {
            id: true,
          },
        });

      const targetMessageIds = targetMessages.map(
        (message) => message.id
      );

      if (targetMessageIds.length > 0) {
        await transaction.chatMessage.updateMany({
          where: {
            replyToMessageId: {
              in: targetMessageIds,
            },
          },
          data: {
            replyToMessageId: null,
          },
        });

        await transaction.chatReaction.deleteMany({
          where: {
            messageId: {
              in: targetMessageIds,
            },
          },
        });
      }

      // ユーザーが作成した提案は残し、作成者だけ解除する
      await transaction.proposal.updateMany({
        where: {
          creatorUserId: targetUserId,
        },
        data: {
          creatorUserId: null,
        },
      });

      await transaction.chatReaction.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      await transaction.vote.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      await transaction.spotRating.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      await transaction.surveyResponse.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      await transaction.stampLog.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      await transaction.chatMessage.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      await transaction.loginHistory.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      await transaction.session.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      await transaction.nFT.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      await transaction.wallet.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      await transaction.user.delete({
        where: {
          id: targetUserId,
        },
      });
    });

    return NextResponse.json({
      message: `${targetUser.name}さんのサーバー上のユーザー情報を削除しました`,
    });
  } catch (error) {
    console.error("ユーザー削除に失敗しました:", error);

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          message: "ログインが必要です",
        },
        {
          status: 401,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          message: "管理者権限が必要です",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json(
      {
        message: "ユーザー情報の削除に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}