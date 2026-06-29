"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildDnftMetadata } from "@/lib/dnftMetadata";
import { PassportCardSvg } from "@/lib/dnft/passportCardSvg";

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
    imageUrl: string | null;
  } | null;
  stamps: {
    id: number;
    visitedAt: string;
    spotName: string;
    floor: string;
  }[];
  spots: {
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

  const visitedSpots = passport.stamps.map((stamp) => stamp.spotName);

  const dnftMetadata = passport.nft
    ? buildDnftMetadata({
        nftId: passport.nft.nftId,
        level: passport.nft.level,
        title: passport.nft.title ?? "Fresh Visitor",
        stampCount: passport.nft.stampCount,
        visitedSpots,
        imageUrl: passport.nft.imageUrl ?? undefined,
      })
    : null;

  const stampCount = passport.nft?.stampCount ?? 0;

  const passportDesign =
    stampCount >= 7
      ? {
          level: 4,
          label: "Level 4",
          title: "Ambassador",
          borderColor: "#ec4899",
          backgroundColor: "#fdf2f8",
          description: "７個以上取得。最大レベルです。",
        }
      : stampCount >= 5
      ? {
          level: 3,
          label: "Level 3",
          title: "Campus Master",
          borderColor: "#f59e0b",
          backgroundColor: "#fffbeb",
          description: "DAO投票提案が可能です。",
        }
      : stampCount >= 3  
      ? {
          level: 2,
          label: "Level 2",
          title: "Research Supprter",
          borderColor: "#8b5cf6",
          backgroundColor: "#f5f3ff",
          description: "DAO投票機能が解放されます。",
        }
      : stampCount >= 1
      ? {
          level: 1,
          label: "Level 1",
          title: "Explorer",
          borderColor: "#3b82f6",
          backgroundColor: "#eff6ff",
          description: "チャット機能が解放されます。",
        }
      : {
          level: 0,
          label: "Level 0",
          title: "Fresh Visitor",
          borderColor: "#d1d5db",
          backgroundColor: "#f9fafb",
          description: "まだ探索開始前です。",
        };

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
      <div
        style={{
          border: `4px solid ${passportDesign.borderColor}`,
          backgroundColor: passportDesign.backgroundColor,
          borderRadius: "16px",
          padding: "20px",
          maxWidth: "360px",
          boxShadow: "0 4px 12px rgba(0,0,0,0,1)",
        }}
      >
        <div style={{ textAlign: "center",  fontWeight: "bold" }}>
          {passportDesign.label}
        </div>

        <h3 style={{ textAlign: "center" }}>OC Passport</h3>
        <h4 style={{ textAlign: "center" }}>{passportDesign.title}</h4>
        

        <p>NFT ID：{passport.nft?.nftId}</p>
        <p>現在のLevel：{passportDesign.level}</p>
        <p>称号：{passportDesign.title}</p>
        <p>取得スタンプ：{stampCount}</p>

        <p style={{ fontSize: "14px" }}>
          {passportDesign.description}
        </p>
      </div>

      <hr />

      <h2>Wallet</h2>
      <p>Symbolアドレス：{passport.wallet?.symbolAddress}</p>
      <hr />
      <button onClick={() => router.push("/scan")}>
        スタンプ取得画面へ
      </button>

      <button onClick={() => router.push("/proposals")}>
        DAO投票画面へ
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

      <hr />
      
      <hr />

            <h3>dNFT Metadata preview</h3>
      {dnftMetadata ? (
        <pre
          style={{
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "8px",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(dnftMetadata, null, 2)}
          </pre>
      ) : (
        <p>Metadataはまだ作成されていません</p>
      )}

      <hr />

      <h2>SVG版 OC Passport</h2>
      <PassportCardSvg
        level={passportDesign.level}
        title={passportDesign.title}
        stampCount={stampCount}
        spots={passport.spots}
        visitedSpots={visitedSpots}
      />
    </div>
  );
}


