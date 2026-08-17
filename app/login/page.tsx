"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        backgroundColor: "#f8fafc",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "32px",
          borderRadius: "20px",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#2563eb",
            fontWeight: "bold",
          }}
        >
          Open Campus Passport
        </p>

        <h1
          style={{
            margin: "0 0 16px",
            fontSize: "28px",
            color: "#0f172a",
          }}
        >
          ログイン
        </h1>

        <p
          style={{
            margin: "0 0 24px",
            color: "#475569",
            lineHeight: 1.8,
          }}
        >
          このシステムではWeb3認証を採用しています。
          <br />
          メールアドレスとパスワードによるログインは利用できません。
        </p>

        <button
          type="button"
          onClick={() => router.push("/start")}
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: "999px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Web3でログイン
        </button>
      </section>
    </main>
  );
}