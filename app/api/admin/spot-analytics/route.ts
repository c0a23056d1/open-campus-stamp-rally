import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();

    const spots = await prisma.spot.findMany({
      orderBy: [
        {
          floor: "asc",
        },
        {
          spotName: "asc",
        },
      ],
      include: {
        stampLogs: true,
      },
    });

    const totalVisits = spots.reduce(
      (sum, spot) =>
        sum + spot.stampLogs.length,
      0
    );

    const spotAnalytics = spots.map((spot) => ({
      id: spot.id,
      spotName: spot.spotName,
      floor: spot.floor,
      visitCount: spot.stampLogs.length,
      percent:
        totalVisits === 0
          ? 0
          : Math.round(
              (spot.stampLogs.length /
                totalVisits) *
                100
            ),
    }));

    return NextResponse.json({
      totalSpots: spots.length,
      totalVisits,
      spotAnalytics,
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
      "スポット分析データ取得エラー:",
      error
    );

    return NextResponse.json(
      {
        message:
          "スポット分析データ取得に失敗しました",
      },
      { status: 500 }
    );
  }
}