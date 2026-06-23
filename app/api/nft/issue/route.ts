import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInitialMosaic } from "@/lib/symbolTransfer";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: {
        wallet: true,
        nft: true,
      },
    });

    if (!user || !user.wallet || !user.nft) {
      return NextResponse.json(
        { message: "ユーザー、Wallet、NFT情報が見つかりません" },
        { status: 404 }
      );
    }

    if (user.nft.issueTxHash) {
      return NextResponse.json(
        { message: "初期NFTは既に付与済みです", nft: user.nft },
        { status: 400 }
      );
    }

    const mosaicId = process.env.INITIAL_NFT_MOSAIC_ID;

    if (!mosaicId) {
      return NextResponse.json(
        { message: "INITIAL_NFT_MOSAIC_ID が設定されていません" },
        { status: 500 }
      );
    }

    const { txHash } = await sendInitialMosaic({
      recipientAddress: user.wallet.symbolAddress,
      mosaicId,
      amount: 1,
      message: "Welcome to OC Passport",
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
      message: "初期NFTをオンチェーン付与しました",
      txHash,
      nft: updatedNft,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "初期NFT付与処理に失敗しました" },
      { status: 500 }
    );
  }
}