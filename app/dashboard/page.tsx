"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");

    if (!name || !email) {
      router.push("/login");
      return;
    }

    setUserName(name);
    setUserEmail(email);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ textAlign: "right" }}>
        {userName} さん
        <button onClick={handleLogout} style={{ marginLeft: "10px" }}>
          ログアウト
        </button>
      </div>

      <h1>ダッシュボード</h1>

      <p>メールアドレス：{userEmail}</p>

      <hr />

      <h2>OC Passport</h2>
      <p>現在のLevel：0</p>
      <p>取得スタンプ数：0</p>
      <p>初期NFT：未実装</p>
    </div>
  );
}