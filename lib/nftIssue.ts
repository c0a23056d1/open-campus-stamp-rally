import { prisma } from "@/lib/prisma";
import { sendInitialMosaic } from "@/lib/symbolTransfer";

export async function issueInitialNftToUser(userId: number) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            wallet: true,
            nft: true,
        },
    });
    if (!user || !user.wallet || !user.nft) {
        throw new Error("ユーザー、Wallet、NFT情報が見つかりません");
    }

    if (user.nft.issueTxHash) {
        return {
            alreadyIssued: true,
            txHash: user.nft.issueTxHash,
            nft: user.nft,
        };
    }

    const mosaicId = process.env.INITIAL_NFT_MOSAIC_ID;

    if (!mosaicId) {
        throw new Error("INITIAL_NFT_MOSAIC_ID が設定されていません");
    }

    const { txHash } = await sendInitialMosaic({
        recipientAddress: user.wallet.symbolAddress,
        mosaicId,
        amount: 1,
    });

    const updatedNft = await prisma.nFT.update({
        where: {
            userId,
        },
        data: {
            mosaicId,
            issueTxHash: txHash,
            issueAt: new Date(),
        },
    });
    return {
        alreadyIssued: false,
        txHash,
        nft: updatedNft,
    };
}