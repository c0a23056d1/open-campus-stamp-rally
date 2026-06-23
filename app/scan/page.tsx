"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ScanPage() {
  const router = useRouter();
  const [qrSecretCode, setQrSecretCode] = useState("");

  const handleScan = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      alert("ログインしてください");
      router.push("/login");
      return;
    }

    const res = await fetch("/api/stamp/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        qrSecretCode,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert(
      `${data.message}\n取得スポット: ${data.spot.floor} ${data.spot.spotName}`
    );

    router.push("/dashboard");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>スタンプ取得</h1>

      <p>
        今回はテスト用として、管理者画面で発行したQRコード内容
        （qrSecretCode）を入力してスタンプ取得します。
      </p>

      <div>
        <label>QRコード内容</label>
        <br />
        <input
          type="text"
          value={qrSecretCode}
          onChange={(e) => setQrSecretCode(e.target.value)}
          placeholder="spot_xxxxx..."
          style={{ width: "400px" }}
        />
      </div>

      <br />

      <button onClick={handleScan}>スタンプ取得</button>

      <button
        onClick={() => router.push("/dashboard")}
        style={{ marginLeft: "10px" }}
      >
        ダッシュボードへ戻る
      </button>
    </div>
  );
}