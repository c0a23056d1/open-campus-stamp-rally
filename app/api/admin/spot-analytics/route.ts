import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function checkAdmin(userId: number) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    return !!user?.isAdmin;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const adminUserId = Number(searchParams.get("adminUserId"));

        if (!adminUserId) {
            return NextResponse.json(
                { message: "adminUserIdが必要です" },
                { status: 400 }
            );
        }

        const spots = await prisma.spot.findMany({
            orderBy: [
                { floor: "asc" },
                { spotName: "asc" },
            ],
            include: {
                stampLogs: true,
            },
        });

        const totalVisits = spots.reduce(
            (sum, spot) => sum + spot.stampLogs.length,
            0
        );

        const spotAnalytics = spots.map((spot) => ({
            id: spot.id,
            spotName: spot.floor,
            floor: spot.floor,
            visitCount: spot.stampLogs.length,
            percent:
              totalVisits === 0
                ? 0
                : Math.round((spot.stampLogs.length / totalVisits) * 100),
        }));

        return NextResponse.json({
            totalSpots: spots.length,
            totalVisits,
            spotAnalytics,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "スポット分析データ取得に失敗しました" },
            { status: 500 }
        );
    }
}