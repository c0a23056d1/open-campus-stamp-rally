import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req:Request) {
    try {
        const {
            userId, 
            title, 
            description,
            requiredLevel,
            startAt,
            endAt,
            options,
        } = await req.json();

        if (!userId || !title || !description || !startAt || !endAt) {
            return NextResponse.json(
                { message: "必要な項目が不足しています" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            include: { nft: true },
        });

        if (!user || !user.nft) {
            return NextResponse.json(
                { message: "ユーザー情報が見つかりません" },
                { status: 404 },
            );
        }

        if (user.nft.level < 3) {
            return NextResponse.json(
                { message: "Proposal提案はlevel3以上で利用できます" },
                { status: 403 }
            );
        }

        const optionLabels = Array.isArray(options)
            ? options.map((option) => String(option).trim()).filter(Boolean)
            : [];
        
        if (optionLabels.length < 2) {
            return NextResponse.json(
                { message: "選択肢は2つ以上必要です" },
                { status: 400 }
            );
        }

        const proposal = await prisma.proposal.create({
            data: {
                title,
                description,
                requiredLevel: Number(requiredLevel),
                startAt: new Date(startAt),
                endAt: new Date(endAt),
                creatorUserId: Number(userId),
                options: {
                    create: optionLabels.map((label, index) => ({
                        label,
                        sortOrder: index,
                    })),
                },
            },
            include: {
                options: true,
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            message: "Proposal案を送信しました。管理者の承認後に公開されます。",
            proposal,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Proposal提案に失敗しました" },
            { status: 500 }
        );
    }
}