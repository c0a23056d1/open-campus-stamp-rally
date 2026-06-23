"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PassportData = {
  user: {
    id: number;
    name: string;
    email: string;
  };
  wallet: {
    symbolAddress: string;
  } | null;
  nft: {
    level: number;
    title: string | null;
    stampCount: number;
    nftId: string;
  } | null;
  stamps: {
    id: number;
    visitedAt: string;
    spotName: string;
    floor: string;
  }[];
};

export default function DashboardPage() {
  const [passport, setPassport] = useState<PassportData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
      return;
    }

    const fetchPassport = async () => {
      const res = await fetch(`/api/passport?userId=${userId}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        router.push("/login");
        return;
      }

      setPassport(data);
    };

    fetchPassport();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleIssueNFT = async () => {
    const userId = localStorage.getItem("userId");

    const res = await fetch("/api/nft/issue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();
    alert(data.message);
  };

  if (!passport) {
    return <div style={{ padding: "20px" }}>読み込み中...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ textAlign: "right" }}>
        {passport.user.name} さん
        <button onClick={handleLogout} style={{ marginLeft: "10px" }}>
          ログアウト
        </button>
      </div>

      <h1>ダッシュボード</h1>

      <p>メールアドレス：{passport.user.email}</p>

      <hr />

      <h2>OC Passport</h2>
      <p>NFT ID：{passport.nft?.nftId}</p>
      <p>現在のLevel：{passport.nft?.level}</p>
      <p>称号：{passport.nft?.title}</p>
      <p>取得スタンプ数：{passport.nft?.stampCount}</p>

      <hr />

      <h2>Wallet</h2>
      <p>Symbolアドレス：{passport.wallet?.symbolAddress}</p>

      <hr />
      <button onClick={handleIssueNFT}>
        初期NFT付与テスト
      </button>
      <hr />
      <button onClick={() => router.push("/scan")}>
        スタンプ取得画面へ
      </button>

      <h2>取得スタンプ</h2>
      {passport.stamps.length === 0 ? (
        <p>まだスタンプを取得していません</p>
      ) : (
        <ul>
          {passport.stamps.map((stamp) => (
            <li key={stamp.id}>
              {stamp.floor}：{stamp.spotName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}