"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    localStorage.setItem("userId", String(data.userId));
    localStorage.setItem("userName", data.name);
    localStorage.setItem("userEmail", data.email);

    alert(data.message);
    router.push("/dashboard");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "430px",
          background: "#ffffff",
          borderRadius: "18px",
          padding: "36px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "8px",
            color: "#1e293b",
          }}
        >
          Open Campus Passport
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            marginBottom: "30px",
          }}
        >
          ログイン
        </p>

        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: "6px",
            }}
          >
            メールアドレス
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "15px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "28px" }}>
          <label
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: "6px",
            }}
          >
            パスワード
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "15px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "999px",
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "16px",
          }}
        >
          ログイン
        </button>

        <button
          onClick={() => router.push("/register")}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "999px",
            border: "1px solid #2563eb",
            background: "#ffffff",
            color: "#2563eb",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          新規登録はこちら
        </button>
      </div>
    </div>
  );
}