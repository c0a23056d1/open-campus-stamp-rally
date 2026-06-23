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
    <div style={{ padding: "20px" }}>
      <h1>ログイン</h1>

      <div>
        <label>メールアドレス</label>
        <br />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <br />

      <div>
        <label>パスワード</label>
        <br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <br />

      <button onClick={handleLogin}>ログイン</button>

      <br />
      <br />

      <button onClick={() => router.push("/register")}>
        新規登録はこちら
      </button>
    </div>
  );
}