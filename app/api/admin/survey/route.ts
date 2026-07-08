import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const QUESTION_COUNT = 16;

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
        const responses = await prisma.surveyResponse.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        const totalResponses = responses.length;
        const questionStats = Array.from({ length: QUESTION_COUNT }, (_, index) => {
            const qNumber = index + 1;
            const key = `q${qNumber}` as keyof (typeof responses)[number];

            const values = responses
                .map((response) => response[key])
                .filter((value): value is number => typeof value === "number");
            
            const average = 
                values.length === 0
                    ? 0
                    : Math.round(
                        (values.reduce((sum, value) => sum + value, 0) / values.length) *
                        10
                    ) / 10;
            const distribution = [1, 2, 3, 4, 5].map((score) => ({
                score,
                count: values.filter((value) => value === score).length,
            }));

            return {
                questionNumber: qNumber,
                average,
                distribution,
            };
        });

        return NextResponse.json({
            totalResponses,
            questionStats,
            responses,
        }); 
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "アンケート分析データ取得に失敗しました" },
            { status: 500 }
        );
    }
}