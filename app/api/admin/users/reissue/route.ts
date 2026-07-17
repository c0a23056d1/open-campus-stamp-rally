import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInitialMosaic } from "@/lib/symbolTransfer";

async function checkAdmin(adminUserId: number) {
    const admin = await prisma.user.findUnique({
        where: { id: adminUserId },
    });
    return !!admin?.isAdmin;
}

export async function POST(req: Request) {
    try {
        const { adminUserId, targetUserId } = await req.json();

        if (!adminUserId || !targetUserId) {
            return NextResponse.json(
                { message: "adminUserIdとtargetUserIdが必要です" },
                { status: 400 }
            );
        }
        if (!(await checkAdmin(Number(adminUserId)))) {
            return NextResponse.json(
                { message: "管理者権限がありません" },
                { status: 403 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(targetUserId) },
            include: {
                wallet: true,
                nft: true,
            },
        });

        if (!user || !user.wallet || !user.nft) {
            return NextResponse.json(
                { message: "対象ユーザー,Wallet,NFT情報が見つかりません。"},
                { status: 404 }
            );
        }

        const mosaicId = process.env.INITIAL_NFT_MOSAIC_ID;
        if (!mosaicId) {
            return NextResponse.json(
                { message: "INITIAL_NFT_MOSAIC_IDが設定されていません" },
                { status: 500 }
            );
        }

        const { txHash } = await sendInitialMosaic({
            recipientAddress: user.wallet.symbolAddress,
            mosaicId,
            amount: 1,
        });

        const updatedNft = await prisma.nFT.update({
            where: {
                userId: user.id,
            },
            data: {
                mosaicId,
                issueTxHash: txHash,
                issueAt: new Date(),
            },
        });

        return NextResponse.json({
            message: "初期NFTを再付与しました",
            txHash,
            nft: updatedNft,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "初期NFT再付与に失敗しました"},
            { status: 500 }
        );
    }
}