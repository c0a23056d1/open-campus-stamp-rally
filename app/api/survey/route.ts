import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export async function POST(req: Request) {
    const sessionUser = await requireUser();
    try {
        const body = await req.json();

        const {
            answers,
            goodPoint,
            improvePoint,
            futureRequest,
            interestTags
        } = body;

        if (
            !Array.isArray(interestTags) ||
            interestTags.length !== 3 ||
            new Set(interestTags).size !== 3
        ) {
            return NextResponse.json(
                { message: "興味分野を重複せず3つ選択してください" },
                { status: 400 }
            );
        }

        if (!answers) {
            return NextResponse.json(
                { message: "回答が必要です" },
                { status: 400 }
            );
        }

        for (let i = 1; i <= 16; i++) {
            const value = answers[`q${i}`];

            if (!value || value < 1 || value > 5) {
                return NextResponse.json(
                    { message: `設問${i}に回答してください` },
                    { status: 400 }
                );
            }
        }

        const response = await prisma.surveyResponse.upsert({
            where: {
                userId: sessionUser.id,
            },
            update: {
                q1: answers.q1,
                q2: answers.q2,
                q3: answers.q3,
                q4: answers.q4,
                q5: answers.q5,
                q6: answers.q6,
                q7: answers.q7,
                q8: answers.q8,
                q9: answers.q9,
                q10: answers.q10,
                q11: answers.q11,
                q12: answers.q12,
                q13: answers.q13,
                q14: answers.q14,
                q15: answers.q15,
                q16: answers.q16,
                interestTagsJson: JSON.stringify(interestTags),
                goodPoint,
                improvePoint,
                futureRequest,
            },
            create: {
                userId: sessionUser.id,
                q1: answers.q1,
                q2: answers.q2,
                q3: answers.q3,
                q4: answers.q4,
                q5: answers.q5,
                q6: answers.q6,
                q7: answers.q7,
                q8: answers.q8,
                q9: answers.q9,
                q10: answers.q10,
                q11: answers.q11,
                q12: answers.q12,
                q13: answers.q13,
                q14: answers.q14,
                q15: answers.q15,
                q16: answers.q16,
                interestTagsJson: JSON.stringify(interestTags),
                goodPoint,
                improvePoint,
                futureRequest,
            },
        });
        await prisma.user.update({
            where: {
                id: sessionUser.id,
            },
            data: {
                surveyCompletedAt: new Date(),
            },
        });
        return NextResponse.json({
            message: "アンケートを保存しました",
            response,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "アンケート保存に失敗しました" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
  const sessionUser = await requireUser();
  try {
    const sessionUser = await requireUser();

    if (!sessionUser.id) {
      return NextResponse.json(
        { message: "userIdが必要です" },
        { status: 400 }
      );
    }

    const response = await prisma.surveyResponse.findUnique({
      where: {
        userId: sessionUser.id,
      },
    });
    
    await prisma.user.update({
    where: {
        id: sessionUser.id,
    },
    data: {
        surveyCompletedAt: new Date(),
    },
    });

    return NextResponse.json({
      answered: !!response,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "アンケート確認に失敗しました" },
      { status: 500 }
    );
  }
}