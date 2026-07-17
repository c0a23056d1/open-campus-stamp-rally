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

    const users = await prisma.user.findMany({
        orderBy: {
            id: "desc",
        },
        include: {
            wallet: true,
            nft: true,
            stampLogs: {
                include: {
                    spot: true,
                },
                orderBy: {
                    visitedAt: "desc",
                },
            },
        },
    });

    return NextResponse.json({ users });
}