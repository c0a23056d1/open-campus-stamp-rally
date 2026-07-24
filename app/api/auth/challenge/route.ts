import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CHALLENGE_EXPIRES_MINUTES = 5;

type ChallengeRequestBody = {
  walletAddress?: unknown;
  publicKey?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChallengeRequestBody;

    const walletAddress =
      typeof body.walletAddress === "string"
        ? body.walletAddress.trim().toUpperCase()
        : "";

    const publicKey =
      typeof body.publicKey === "string"
        ? body.publicKey.trim().toUpperCase()
        : "";

    if (!walletAddress || !publicKey) {
      return NextResponse.json(
        {
          message: "ウォレットアドレスと公開鍵が必要です",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Symbolの公開鍵は通常64文字の16進数です。
     * 詳細なアドレス検証は署名検証API側でも行います。
     */
    if (!/^[0-9A-F]{64}$/.test(publicKey)) {
      return NextResponse.json(
        {
          message: "公開鍵の形式が正しくありません",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ハイフンなしのSymbolアドレスを想定します。
     * testnetでは通常Tから始まります。
     */
    if (!/^T[A-Z2-7]{38}$/.test(walletAddress)) {
      return NextResponse.json(
        {
          message: "Symbolアドレスの形式が正しくありません",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 同じウォレットの古い未使用チャレンジを無効化します。
     * usedAtに現在時刻を設定することで、再利用を防ぎます。
     */
    await prisma.authChallenge.updateMany({
      where: {
        walletAddress,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const nonce = randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + CHALLENGE_EXPIRES_MINUTES * 60 * 1000
    );

    /*
     * 改行や項目順を含め、このmessage全体に署名します。
     * クライアント側でもサーバーから返されたmessageを
     * そのまま署名してください。
     */
    const message = [
      "Open Campus Passport Authentication",
      `Address: ${walletAddress}`,
      `Nonce: ${nonce}`,
      `ExpiresAt: ${expiresAt.toISOString()}`,
    ].join("\n");

    const challenge = await prisma.authChallenge.create({
      data: {
        walletAddress,
        publicKey,
        nonce,
        message,
        expiresAt,
      },
      select: {
        id: true,
        nonce: true,
        message: true,
        expiresAt: true,
      },
    });

    return NextResponse.json(
      {
        message: challenge.message,
        nonce: challenge.nonce,
        challengeId: challenge.id,
        expiresAt: challenge.expiresAt.toISOString(),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    /*
     * JSONの形式不正などもここに入ります。
     * 秘密情報やスタックトレースはレスポンスへ返しません。
     */
    console.error("認証チャレンジの発行に失敗しました:", error);

    return NextResponse.json(
      {
        message: "認証チャレンジの発行に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}