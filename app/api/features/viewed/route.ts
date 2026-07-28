import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

type FeatureName = "vote" | "proposal";

export async function POST(req: Request) {
  try {
    const currentUser = await requireUser();

    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("feature" in body) ||
      typeof body.feature !== "string"
    ) {
      return NextResponse.json(
        {
          message: "featureが必要です",
        },
        {
          status: 400,
        }
      );
    }

    const feature = body.feature as FeatureName;

    if (
      feature !== "vote" &&
      feature !== "proposal"
    ) {
      return NextResponse.json(
        {
          message: "無効な機能です",
        },
        {
          status: 400,
        }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data:
        feature === "vote"
          ? {
              voteFeatureViewedAt: new Date(),
            }
          : {
              proposalFeatureViewedAt: new Date(),
            },
      select: {
        id: true,
        voteFeatureViewedAt: true,
        proposalFeatureViewedAt: true,
      },
    });

    return NextResponse.json({
      message: "閲覧状態を更新しました",
      user: updatedUser,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          message:
            "認証されていません。もう一度認証してください。",
        },
        {
          status: 401,
        }
      );
    }

    console.error(
      "機能閲覧状態の更新エラー:",
      error
    );

    return NextResponse.json(
      {
        message:
          "機能閲覧状態の更新に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}