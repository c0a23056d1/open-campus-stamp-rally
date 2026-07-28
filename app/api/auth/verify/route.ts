import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const NETWORK = process.env.SYMBOL_NETWORK || "testnet";
const textEncoder = new TextEncoder();

type VerifyRequestBody = {
  challengeId?: unknown;
  signature?: unknown;
  walletAddress?: unknown;
  publicKey?: unknown;
  name?: unknown;
  researchConsent?: unknown;
};

export async function POST(request: Request) {
  let isNewUser = false;
  console.log("===== VERIFY API START =====");
  try {
    const body = (await request.json()) as VerifyRequestBody;

    const challengeId =
      typeof body.challengeId === "string"
        ? body.challengeId.trim()
        : "";

    const signatureHex =
      typeof body.signature === "string"
        ? body.signature.trim().toUpperCase()
        : "";

    const walletAddress =
      typeof body.walletAddress === "string"
        ? body.walletAddress.trim().toUpperCase()
        : "";

    const publicKeyHex =
      typeof body.publicKey === "string"
        ? body.publicKey.trim().toUpperCase()
        : "";

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";
    const researchConsent =
      body.researchConsent === true;
    if (
      !challengeId ||
      !signatureHex ||
      !walletAddress ||
      !publicKeyHex
    ) {
      return NextResponse.json(
        {
          message: "認証に必要な情報が不足しています",
        },
        {
          status: 400,
        }
      );
    }

    if (!researchConsent) {
      return NextResponse.json(
        {
          message: "研究参加への同意が必要です",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length < 1 || name.length > 30) {
      return NextResponse.json(
        {
          message: "ニックネームは1文字以上30文字以下で入力してください",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^[0-9A-F]{64}$/.test(publicKeyHex)) {
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
     * Symbol署名は64バイトなので、
     * 16進数文字列では128文字になる。
     */
    if (!/^[0-9A-F]{128}$/.test(signatureHex)) {
      return NextResponse.json(
        {
          message: "署名の形式が正しくありません",
        },
        {
          status: 400,
        }
      );
    }

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

    const challenge = await prisma.authChallenge.findUnique({
      where: {
        id: challengeId,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        {
          message: "認証チャレンジが見つかりません",
        },
        {
          status: 401,
        }
      );
    }

    if (challenge.usedAt) {
      return NextResponse.json(
        {
          message: "この認証チャレンジは既に使用されています",
        },
        {
          status: 401,
        }
      );
    }

    if (challenge.expiresAt <= new Date()) {
      return NextResponse.json(
        {
          message: "認証チャレンジの有効期限が切れています",
        },
        {
          status: 401,
        }
      );
    }

    if (
      challenge.walletAddress !== walletAddress ||
      challenge.publicKey !== publicKeyHex
    ) {
      return NextResponse.json(
        {
          message: "チャレンジとウォレット情報が一致しません",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * 公開鍵からSymbolアドレスを再計算し、
     * リクエストのアドレスと一致するか確認する。
     */
    const [{ PublicKey, Signature }, symbolModule] =
        await Promise.all([
            import("symbol-sdk"),
            import("symbol-sdk/symbol"),
        ]);

    const { SymbolFacade, Verifier } = symbolModule;
    
    const facade = new SymbolFacade(NETWORK);
    const publicKey = new PublicKey(publicKeyHex);

    const derivedAddress = facade.network
      .publicKeyToAddress(publicKey)
      .toString();

    if (derivedAddress !== walletAddress) {
      return NextResponse.json(
        {
          message: "公開鍵とSymbolアドレスが一致しません",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Challenge APIがDBへ保存したmessage全体を検証する。
     * クライアント側も同じ文字列全体へ署名している。
     */
    const verifier = new Verifier(publicKey);
    const signature = new Signature(signatureHex);
    const messageBytes = textEncoder.encode(challenge.message);

    const isValidSignature = verifier.verify(
      messageBytes,
      signature
    );

    if (!isValidSignature) {
      return NextResponse.json(
        {
          message: "署名を検証できませんでした",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * usedAtの更新とUser作成をトランザクションで行う。
     * 同じChallengeを同時に再利用できないよう、
     * usedAtがnullの場合だけ更新する。
     */
    const user = await prisma.$transaction(async (transaction) => {
      const consumeResult =
        await transaction.authChallenge.updateMany({
          where: {
            id: challenge.id,
            usedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
          data: {
            usedAt: new Date(),
          },
        });

      if (consumeResult.count !== 1) {
        throw new Error("CHALLENGE_ALREADY_USED");
      }

      const existingWallet =
        await transaction.wallet.findUnique({
          where: {
            symbolAddress: walletAddress,
          },
          include: {
            user: true,
          },
        });

      if (existingWallet) {
        /*
         * 登録済みウォレットでは、
         * 保存済み公開鍵とも一致することを確認する。
         */
        if (
          existingWallet.symbolPublicKey.toUpperCase() !==
          publicKeyHex
        ) {
          throw new Error("PUBLIC_KEY_MISMATCH");
        }
        // 初回同意日時が未登録なら保存
        if (!existingWallet.user.consentAt) {
          await transaction.user.update({
            where: {
              id: existingWallet.user.id,
            },
            data: {
              consentAt: new Date(),
            },
          });
        }
        return existingWallet.user;
      }

      /*
       * Web3方式ではemail、passwordHash、
       * encryptedPrivateKeyをDBへ保存しない。
       */
      if (!name) {
        throw new Error("USER_NOT_FOUND");
      }

      isNewUser = true;

      return transaction.user.create({
        data: {
          name,
          consentAt: new Date(),
          wallet: {
            create: {
              symbolAddress: walletAddress,
              symbolPublicKey: publicKeyHex,
              encryptedPrivateKey: null,
            },
          },
          nft: {
            create: {
              nftId: `OC_PASS_${Date.now()}`,
              level: 0,
              title: "Beginner",
              stampCount: 0,
            },
          },
        },
      });
    });

    /*
     * 認証成功後にSessionを作成し、
     * HttpOnly Cookieを発行する。
     */
    await createSession(user.id);

    /*
     * 初回作成ユーザーへ初期モザイクを送る。
     * Symbol側の失敗によって認証自体は失敗させない。
     */
    if (isNewUser) {
      try {
        const { issueInitialNftToUser } = await import(
          "@/lib/symbol/nftIssue"
        );

        await issueInitialNftToUser(user.id);
      } catch (issueError) {
        console.error(
          "初期NFTのオンチェーン付与に失敗しました:",
          issueError
        );
      }
    }

    return NextResponse.json({
      message: "Web3認証に成功しました",
      user: {
        id: user.id,
        name: user.name,
        isNewUser,
      },
    });
  } catch (error) {
    console.log("===== VERIFY API ERROR =====");
    console.error(error);
    if (
      error instanceof Error &&
      error.message === "CHALLENGE_ALREADY_USED"
    ) {
      return NextResponse.json(
        {
          message: "この認証チャレンジは既に使用されています",
        },
        {
          status: 401,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message === "PUBLIC_KEY_MISMATCH"
    ) {
      return NextResponse.json(
        {
          message: "登録済みウォレットの公開鍵と一致しません",
        },
        {
          status: 401,
        }
      );
    }

    console.error("Web3署名認証に失敗しました:", error);

    if (
      error instanceof Error &&
      error.message === "USER_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          message:
            "このウォレットは登録されいません",
        },
        {
          status: 404,
        }
      );
    }

    if (error instanceof Error) {
        console.error("エラー名:", error.name);
        console.error("エラーメッセージ:", error.message);
        console.error("スタックトレース:", error.stack);
    }

    return NextResponse.json(
      {
        message: "Web3署名認証に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}