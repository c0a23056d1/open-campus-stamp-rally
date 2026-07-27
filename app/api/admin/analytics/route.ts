import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();

    const totalUsers =
      await prisma.user.count();

    const nfts = await prisma.nFT.findMany({
      select: {
        stampCount: true,
      },
    });

    const stampDistribution = Array.from(
      { length: 11 },
      (_, stampCount) => ({
        stampCount,
        userCount: 0,
      })
    );

    nfts.forEach((nft) => {
      const count = Math.min(
        Math.max(nft.stampCount, 0),
        10
      );

      stampDistribution[count].userCount += 1;
    });

    return NextResponse.json({
      totalUsers,
      stampDistribution,
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

    console.error(
      "分析データ取得エラー:",
      error
    );

    return NextResponse.json(
      {
        message:
          "分析データ取得に失敗しました",
      },
      { status: 500 }
    );
  }
}