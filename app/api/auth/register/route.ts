import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { issueInitialNftToUser } from "@/lib/symbol/nftIssue";

export async function POST(req: Request) {
  try {
    /*
     * HttpOnly Cookie
     *   ↓
     * Sessionテーブル
     *   ↓
     * Userテーブル
     *
     * フロントエンドからuserIdを受け取らず、
     * セッションから認証済みユーザーを特定する。
     */
    const currentUser = await requireUser();

    const { researchConsent } = await req.json();

    // サーバー側でも研究参加への同意を確認する
    if (researchConsent !== true) {
      return NextResponse.json(
        {
          message: "研究参加への同意が必要です",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * すでに同意済みの場合は、最初の同意日時を上書きしない。
     */
    if (currentUser.consentAt) {
      return NextResponse.json({
        message: "研究参加への同意は既に登録されています",
        userId: currentUser.id,
        consentAt: currentUser.consentAt,
        alreadyConsented: true,
      });
    }

    const user = await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        consentAt: new Date(),
      },
      include: {
        wallet: true,
        nft: true,
      },
    });

    /*
     * 初期NFTのオンチェーン発行を実行する。
     * issueInitialNftToUser側で二重発行を防止している前提。
     *
     * NFT発行を別の認証APIですでに行っている場合は、
     * このtry〜catch部分を削除して構わない。
     */
    let issueResult = null;

    try {
      issueResult = await issueInitialNftToUser(user.id);
    } catch (issueError) {
      console.error(
        "初期NFTのオンチェーン発行に失敗しました:",
        issueError
      );
    }

    return NextResponse.json({
      message: "研究参加への同意を登録しました",
      userId: user.id,
      consentAt: user.consentAt,
      alreadyConsented: false,
      wallet: user.wallet,
      nft: user.nft,
      nftIssue: issueResult
        ? {
            txHash: issueResult.txHash,
            alreadyIssued: issueResult.alreadyIssued,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          message: "認証が必要です",
        },
        {
          status: 401,
        }
      );
    }

    console.error("研究参加同意の登録に失敗しました:", error);

    return NextResponse.json(
      {
        message: "研究参加同意の登録に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}