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

        if (!(await checkAdmin(adminUserId))) {
            return NextResponse.json(
                { message: "管理者権限がありません" },
                { status: 403 }
            );
        }

        const totalUsers = await prisma.user.count();
        const nfts = await prisma.nFT.findMany({
            select: {
                stampCount: true,
            },
        });

        const stampDistribution = Array.from({ length: 11 }, (_, stampCount) => ({
            stampCount,
            userCount: 0,
        }));

        nfts.forEach((nft) => {
            const count = Math.min(nft.stampCount, 10);
            stampDistribution[count].userCount += 1;
        });

        return NextResponse.json({
            totalUsers,
            stampDistribution,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "分析データ取得に失敗しました" },
            { status: 500 }
        );
    }
}