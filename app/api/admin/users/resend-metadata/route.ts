import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDnftMetadata } from "@/lib/dnftMetadata";
import { sendDnftMetadata } from "@/lib/symbolMetadata";

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
                stampLogs: {
                    include: {
                        spot: true,
                    },
                    orderBy: {
                        visitedAt: "asc",
                    },
                },
            },
        });

        if (!user || !user.wallet || !user.nft) {
            return NextResponse.json(
                { message: "対象ユーザー,Wallet,NFT情報が見つかりません。"},
                { status: 404 }
            );
        }

        const visitedSpots = user.stampLogs.map((log) => log.spot.spotName);

        const metadata = buildDnftMetadata({
            nftId: user.nft.nftId,
            level: user.nft.level,
            title: user.nft.title ?? "Beginner",
            stampCount: user.nft.stampCount,
            visitedSpots,
        });

        const { txHash } = await sendDnftMetadata({
            recipientAddress: user.wallet.symbolAddress,
            metadataJson: JSON.stringify(metadata),
        });

        const updatedNft = await prisma.nFT.update({
            where: {
                userId: user.id,
            },
            data: {
                metadataJson: JSON.stringify(metadata),
                imageUrl: metadata.image,
                metadataTxHash: txHash,
                metadataUpdatedAt: new Date(),
            },
        });

        return NextResponse.json({
            message: "メタデータを再送信しました",
            txHash,
            nft: updatedNft,
            metadata,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Metadata再送信に失敗しました" },
            {status: 500}
        );
    }
}