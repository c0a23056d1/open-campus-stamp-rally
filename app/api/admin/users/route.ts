import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
    try {
        await requireAdmin();

        const users = await prisma.user.findMany({
            orderBy: {
                id: "desc",
            },
            select: {
                id: true,
                name: true,
                email: true,
                isAdmin: true,
                createdAt: true,
                wallet: {
                    select: {
                        id: true,
                        symbolAddress: true,
                        symbolPublicKey: true,
                    },
                },
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

        console.error("ユーザー一覧取得エラー:", error);

        return NextResponse.json(
            { message: "ユーザー一覧の取得に失敗しました" },
            { status: 500 }
        );
    }
}