import { NextResponse } from "next/server";
import { issueInitialNftToUser } from "@/lib/nftIssue";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "userIdが必要です" },
        { status: 400 }
      );
    }

    const result = await issueInitialNftToUser(Number(userId));

    if (result.alreadyIssued) {
      return NextResponse.json(
        {
          message: "初期NFTは既に付与済みです",
          txHash: result.txHash,
          nft: result.nft,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "初期NFTをオンチェーン付与しました",
      txHash: result.txHash,
      nft: result.nft,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "初期NFT付与処理に失敗しました" },
      { status: 500 }
    );
  }
}