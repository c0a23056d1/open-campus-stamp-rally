"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  decryptPrivateKey,
  encryptPrivateKey,
  validatePin,
} from "@/lib/auth/encryption";

import {
  // getWallet,
  loadWallet,
  hasWallet,
  saveWallet,
} from "@/lib/auth/indexedDb";

type ChallengeResponse = {
  message: string;
  nonce: string;
  challengeId: string;
  expiresAt: string;
};

export default function StartPage() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirmation, setPinConfirmation] = useState("");

  const [hasExistingWallet, setHasExistingWallet] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const initializeStartPage = async () => {
      try {
        const sessionResponse = await fetch(
          "api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );
        if (sessionResponse.ok) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        const walletExists = await hasWallet();
        setHasExistingWallet(walletExists);
      } catch (error) {
        console.error(
          "ログイン状態の確認に失敗しました",
          error
        );

        try {
          const walletExists = await hasWallet();
          setHasExistingWallet(walletExists);
        } catch {
          setHasExistingWallet(false);
        }
      } finally {
        setCheckingSession(false);
      }
    };

    initializeStartPage();
  }, [router]);

  const handleStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage("");
    setStatusMessage("");

    const trimmedName = name.trim();

    if (trimmedName.length < 1 || trimmedName.length > 30) {
      setErrorMessage(
        "ニックネームは1文字以上30文字以下で入力してください"
      );
      return;
    }

    if (pin !== pinConfirmation) {
      setErrorMessage("PINとPIN確認が一致していません");
      return;
    }

    try {
      validatePin(pin);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "PINの形式が正しくありません"
      );
      return;
    }

    setIsProcessing(true);

    try {
      /*
       * 既存ウォレットを誤って上書きしないための確認。
       */
      const walletAlreadyExists = await hasWallet();

      if (walletAlreadyExists) {
        throw new Error(
          "このブラウザには既にウォレットがあります。新しいウォレットで上書きすることはできません"
        );
      }

      setStatusMessage("ウォレットを作成しています……");

      /*
       * privateKeyはこの関数内だけで保持し、
       * APIやconsoleへ出力しない。
       */

      setStatusMessage("ウォレット機能を読み込んでいます...");

      const {
        generateClientSymbolWallet,
        signAuthenticationMessage,
      } = await import("@/lib/auth/clientWallet");
      const wallet = generateClientSymbolWallet();

      setStatusMessage("ウォレットを保護しています……");

      const encryptedPrivateKey = await encryptPrivateKey(
        wallet.privateKey,
        pin
      );

      setStatusMessage("認証情報を取得しています……");

      const challengeResponse = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: wallet.symbolAddress,
          publicKey: wallet.symbolPublicKey,
        }),
      });

      const challengeData =
        (await challengeResponse.json()) as Partial<ChallengeResponse> & {
          message?: string;
        };

      if (
        !challengeResponse.ok ||
        !challengeData.challengeId ||
        !challengeData.message ||
        !challengeData.nonce ||
        !challengeData.expiresAt
      ) {
        throw new Error(
          challengeData.message ||
            "認証チャレンジの取得に失敗しました"
        );
      }

      setStatusMessage("本人確認用の署名を作成しています……");

      const signature = signAuthenticationMessage(
        wallet.privateKey,
        challengeData.message
      );

      if (!signature) {
        throw new Error("署名の作成に失敗しました");
      }

      setStatusMessage("署名を確認しています……");

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          challengeId: challengeData.challengeId,
          signature,
          walletAddress: wallet.symbolAddress,
          publicKey: wallet.symbolPublicKey,
          name: trimmedName,
        }),
      });

      const verifyResponseText = await verifyResponse.text();

      let verifyData: {
        message?: string;
        user?: {
          id: number;
          name: string | null;
        };
      };

      try {
        verifyData = JSON.parse(verifyResponseText);
      } catch {
        console.error(
          "Verify APIがHTMLを返しました\n",
          verifyResponseText
        );

        throw new Error(
          `Verify APIでサーバーエラーが発生しました (HTTP ${verifyResponse.status})`
        );
      }

      if (!verifyResponse.ok) {
        throw new Error(
          verifyData.message ?? "署名認証に失敗しました"
        );
      }

      /*
       * 現在はverify APIが未実装なので、
       * 署名作成まで成功した時点でIndexedDBへ保存する。
       *
       * verify API実装後は、認証成功後に保存する形へ変更する。
       */
      await saveWallet({
        symbolAddress: wallet.symbolAddress,
        symbolPublicKey: wallet.symbolPublicKey,
        encryptedPrivateKey:
          encryptedPrivateKey.encryptedPrivateKey,
        salt: encryptedPrivateKey.salt,
        iv: encryptedPrivateKey.iv,
        createdAt: new Date().toISOString(),
      });

      /*
       * 秘密鍵・PIN・署名はconsoleへ出力しない。
       */
      setStatusMessage(
        "Web3認証に成功しました。ダッシュボードへ移動します……"
      );

      router.push("/dashboard");
      router.refresh();

      /*
       * 次のverify APIで使用する値。
       * 現段階ではサーバーへは送っていない。
       *
       * challengeId
       * signature
       * wallet.symbolAddress
       * wallet.symbolPublicKey
       * trimmedName
       */
      void challengeData.challengeId;
      void trimmedName;
    } catch (error) {
      console.error(
        "Web3認証準備処理に失敗しました:",
        error instanceof Error ? error.message : "Unknown error"
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "スタンプラリーの準備に失敗しました"
      );

      setStatusMessage("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event?.preventDefault();

    setErrorMessage("");
    setStatusMessage("");

    try {
      validatePin(pin);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "PINが正しくありません"
      );
      return;
    }
    setIsProcessing(true);

    try {
      const wallet = await loadWallet();

      if (!wallet) {
        throw new Error("保存済みウォレットがありません");
      }

      const privateKey = await decryptPrivateKey(wallet, pin);

      const {
        signAuthenticationMessage,
      } = await import("@/lib/auth/clientWallet");

      const challengeResponse = await fetch("/api/auth/challenge", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: wallet.symbolAddress,
            publicKey: wallet.symbolPublicKey,
          }),
        }
      );

      const challenge = await challengeResponse.json();

      const signature = signAuthenticationMessage(
        privateKey,
        challenge.message
      );

      const verifyResponse = await fetch(
        "/api/auth/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            challengeId: challenge.challengeId,
            signature,
            walletAddress: wallet.symbolAddress,
            publicKey: wallet.symbolPublicKey,
          }),
        }
      );

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.message);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "PIN認証に失敗しました"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkingSession) {
    return (
      "ローディング"
    );
  }
  return ( 
    <main
      style={{
        maxWidth: "520px",
        margin: "0 auto",
        padding: "32px 20px",
      }}
    >
      <section
        style={{
          border: "1px solid #d9e2f2",
          borderRadius: "20px",
          padding: "28px 24px",
          background: "#ffffff",
          boxShadow: "0 12px 32px rgba(0, 43, 102, 0.08)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#2563eb",
            fontWeight: 700,
          }}
        >
          Open Campus Passport
        </p>

        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "28px",
          }}
        >
          {
          hasExistingWallet
          ? "スタンプラリーを再開"
          : "スタンプラリーを始める"
          }
        </h1>

        <p
          style={{
            margin: "0 0 28px",
            lineHeight: 1.7,
            color: "#4b5563",
          }}
        >
          {
          hasExistingWallet
            ? "パスワードを入力してスタンプラリーを再開します"
            : "新しいデジタルパスポートを作成します。設定したパスワードは、この端末内のウォレットを保護するために使用します。"
          }
        </p>

        <form 
          onSubmit={
            hasExistingWallet
              ? handleRestore
              : handleStart
          }
        >
          
            {!hasExistingWallet && (
              <>
                <label
                  htmlFor="nickname"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 700,
                  }}
                >ニックネーム</label>
                <input
                  id="nickname"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={30}
                  autoComplete="nickname"
                  disabled={isProcessing}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 14px",
                    marginBottom: "20px",
                    border: "1px solid #b8c5d8",
                    borderRadius: "10px",
                    fontSize: "16px",
                  }}
                />
              </>
            )}

          <label
            htmlFor="pin"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 700,
            }}
          >
            パスワード（6～12桁）
          </label>

          <input
            id="pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, ""))
            }
            minLength={6}
            maxLength={12}
            autoComplete="new-password"
            disabled={isProcessing}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              marginBottom: "20px",
              border: "1px solid #b8c5d8",
              borderRadius: "10px",
              fontSize: "16px",
            }}
          />
            {!hasExistingWallet && (
              <>
                <label
                  htmlFor="pinConfirmation"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 700,
                  }}
                >
                  パスワード確認
                </label>
                <input
                  id="pinConfirmation"
                  type="password"
                  inputMode="numeric"
                  value={pinConfirmation}
                  onChange={(event) =>
                    setPinConfirmation(
                      event.target.value.replace(/\D/g, "")
                    )
                  }
                  minLength={6}
                  maxLength={12}
                  autoComplete="new-password"
                  disabled={isProcessing}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 14px",
                    marginBottom: "24px",
                    border: "1px solid #b8c5d8",
                    borderRadius: "10px",
                    fontSize: "16px",
                  }}
                />
              </>
            )}

          {errorMessage && (
            <p
              role="alert"
              style={{
                padding: "12px",
                marginBottom: "16px",
                borderRadius: "8px",
                background: "#fef2f2",
                color: "#b91c1c",
              }}
            >
              {errorMessage}
            </p>
          )}

          {statusMessage && (
            <p
              aria-live="polite"
              style={{
                padding: "12px",
                marginBottom: "16px",
                borderRadius: "8px",
                background: "#eff6ff",
                color: "#1d4ed8",
              }}
            >
              {statusMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            style={{
              width: "100%",
              padding: "14px 18px",
              border: "none",
              borderRadius: "999px",
              background: isProcessing ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: isProcessing ? "not-allowed" : "pointer",
            }}
          >
            {isProcessing
              ? "準備しています……"
              : "スタンプラリーを始める"}
          </button>
        </form>

        <p
          style={{
            margin: "20px 0 0",
            fontSize: "13px",
            lineHeight: 1.6,
            color: "#64748b",
          }}
        >
          現在のシステムでは、ブラウザデータを削除した場合や端末を変更した場合、
          デジタルパスポートを復元できません。
        </p>
      </section>
    </main>
  );
}