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
  const [researchConsent, setResearchConsent] = useState(false);

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
          "/api/auth/me",
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

    if (!researchConsent) {
      setErrorMessage(
        "研究説明を確認し、研究参加への同意にチェックしてください"
      );
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
          researchConsent,
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
      * 署名検証とセッション作成に成功した後、
      * 暗号化したウォレット情報をIndexedDBへ保存する。
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
  const isStartDisabled = isProcessing || !researchConsent;
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
          スタンプラリーを始める！
        </h1>

        <p
          style={{
            margin: "0 0 28px",
            lineHeight: 1.7,
            color: "#4b5563",
          }}
        >
          この端末にデジタルパスポートを作成します。
          設定したPINは、この端末内のウォレットを保護するために使用します。
        </p>

        <form onSubmit={handleStart}>
          <label
            htmlFor="nickname"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 700,
            }}
          >
            ニックネーム
          </label>

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

          <label
            htmlFor="pin"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 700,
            }}
          >
            PIN（6～12桁）
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

          <label
            htmlFor="pinConfirmation"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 700,
            }}
          >
            PIN確認
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
          <section
            aria-labelledby="research-consent-heading"
            style={{
              marginBottom: "20px",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
              background: "#f8fafc",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 16px 8px",
              }}
            >
              <h2
                id="research-consent-heading"
                style={{
                  margin: "0 0 10px",
                  fontSize: "18px",
                }}
              >
                研究参加について
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#475569",
                  fontSize: "14px",
                  lineHeight: 1.7,
                }}
              >
                以下の説明を最後まで確認したうえで、研究への参加に同意する場合は
                チェックを入れてください。
              </p>
            </div>

            <div
              tabIndex={0}
              style={{
                maxHeight: "320px",
                overflowY: "auto",
                padding: "8px 16px 16px",
                color: "#334155",
                fontSize: "14px",
                lineHeight: 1.8,
              }}
            >
              <h3 style={{ fontSize: "15px", marginBottom: "6px" }}>
                ■研究の目的
              </h3>

              <p>
                本アプリは、東京工科大学コンピュータサイエンス学部
                細野研究室が実施する「Web3技術を活用した
                オープンキャンパススタンプラリーシステム」に関する
                卒業研究で利用します。
              </p>

              <p>
                本研究では、オープンキャンパスにおける参加者の体験を
                動的NFT（dNFT）として記録し、行動履歴の永続保持・
                可視化・活用の有効性を検証します。
                また、DAOの仕組みを利用した投票、提案、チャット等を通じて、
                参加者同士や大学との継続的な交流および意見反映の可能性を
                検証します。
              </p>

              <h3 style={{ fontSize: "15px", marginBottom: "6px" }}>
                ■取得する情報
              </h3>

              <p>
                本研究では、Symbolウォレットアドレス、ニックネーム、
                研究室の訪問履歴、スタンプ取得履歴、dNFT情報、
                研究室評価、アンケート回答、DAO機能の利用履歴、
                システム利用ログ等を取得します。
                氏名、住所、電話番号、メールアドレスなど、
                個人を直接特定する情報は取得しません。
              </p>

              <h3 style={{ fontSize: "15px", marginBottom: "6px" }}>
                ■研究参加の任意性
              </h3>

              <p>
                本研究への参加は任意です。参加しない場合や、
                途中で参加を取りやめた場合でも、不利益を受けることはありません。
                同意した後でも、いつでも研究参加を撤回できます。
              </p>

              <h3 style={{ fontSize: "15px", marginBottom: "6px" }}>
                ■同意の撤回
              </h3>

              <p>
                研究参加への同意を撤回する場合は、東京工科大学
                コンピュータサイエンス学部 細野研究室
                （研究棟A1109）までご連絡ください。
              </p>

              <p>
                ご本人からの申し出を確認後、サーバー上で管理する
                アカウントおよび研究データは削除・破棄します。
                ただし、ブロックチェーン上に既に記録されたデータは、
                技術的な特性上削除できません。
              </p>

              <p>
                また、匿名化または統計処理されたデータが既に卒業研究、
                学会発表、論文等で公表されている場合は、
                公表済みの内容を取り消せないことがあります。
              </p>

              <h3 style={{ fontSize: "15px", marginBottom: "6px" }}>
                ■データの利用と公表
              </h3>

              <p>
                取得したデータは、本研究の目的の範囲内でのみ利用します。
                研究成果を卒業論文、学会発表、論文等で公表する場合は、
                個人を特定できないよう匿名化または統計的に処理します。
              </p>

              <h3 style={{ fontSize: "15px", marginBottom: "6px" }}>
                ■外部サービス
              </h3>

              <p>
                本システムでは、Vercel、Neon PostgreSQL、
                Pinata（IPFS）、Symbolブロックチェーン等の
                外部サービスを利用します。
              </p>

              <h3 style={{ fontSize: "15px", marginBottom: "6px" }}>
                ■想定されるリスクと対応
              </h3>

              <p>
                通信料が発生する可能性、通信障害等により一時的に
                サービスを利用できない可能性、利用履歴等から個人が
                推測される可能性があります。
                取得する情報は必要最小限とし、適切なアクセス制御を行います。
              </p>

              <p>
                万一、情報漏えい等の事故が発生した場合は、
                速やかに大学へ報告し、大学の規程に従って対応します。
              </p>
            </div>
          </section>

          <label
            htmlFor="researchConsent"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "24px",
              padding: "14px",
              border: researchConsent
                ? "1px solid #2563eb"
                : "1px solid #cbd5e1",
              borderRadius: "10px",
              background: researchConsent ? "#eff6ff" : "#ffffff",
              cursor: isProcessing ? "not-allowed" : "pointer",
              lineHeight: 1.7,
            }}
          >
            <input
              id="researchConsent"
              name="researchConsent"
              type="checkbox"
              checked={researchConsent}
              onChange={(event) =>
                setResearchConsent(event.target.checked)
              }
              disabled={isProcessing}
              required
              style={{
                width: "18px",
                height: "18px",
                marginTop: "3px",
                flexShrink: 0,
              }}
            />

            <span>
              上記の説明を読み、研究内容およびデータの取扱いを理解したうえで、
              本研究への参加に自由意思で同意します。
            </span>
          </label>
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
            disabled={isStartDisabled}
            style={{
              width: "100%",
              padding: "14px 18px",
              border: "none",
              borderRadius: "999px",
              background: isStartDisabled ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: isStartDisabled ? "not-allowed" : "pointer",
            }}
          >
            {isProcessing
              ? "準備しています……"
              : "同意してスタンプラリーを始める"}
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
          現在の試作版では、ブラウザデータを削除した場合や端末を変更した場合、
          デジタルパスポートを復元できません。
        </p>
      </section>
    </main>
  );
}