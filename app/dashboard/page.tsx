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
    return <div style={{ padding: "24px" }}>読み込み中...</div>;
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
  const totalSpotCount = passport.spots.length;
  const dnftImageUrl = passport.nft?.imageUrl
      ? passport.nft.imageUrl.replace(
        "ipfs://",
        "https://gateway.pinata.cloud/ipfs/"
      )
      :null;

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

            {/* <h2 style={{ textAlign: "center" }}>OC Passport</h2> */}

      <div
        style={{
          border: `4px solid ${passportDesign.borderColor}`,
          backgroundColor: passportDesign.backgroundColor,
          borderRadius: "20px",
          padding: "18px",
          maxWidth: "480px",
          margin: "0 auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}
      >
        {dnftImageUrl && (
          <div
            style={{
              textAlign: "center",
              margin: "8px 0 6px",
            }}
          >
            <img
              src={dnftImageUrl}
              alt="dNFT Passport"
              style={{
                width: "100%",
                maxWidth: "420px",
                borderRadius: "16px",
                display: "block",
                margin: "0 auto",
              }}
            />
          </div>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: "-48px",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "24px",
              fontWeight: "bold",
              color: passportDesign.borderColor,
            }}
          >
            {passportDesign.title}
          </p>

          <p
            style={{
              margin: "0",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {passportDesign.label}
          </p>

          <div
            style={{
              margin: "18px auto 8px",
              maxWidth: "260px",
            }}
          >
            <div
              style={{
                height: "6px",
                backgroundColor: "#e5e7eb",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${
                    totalSpotCount > 0
                      ? (stampCount / totalSpotCount) * 100
                      : 0
                  }%`,
                  backgroundColor: passportDesign.borderColor,
                  borderRadius: "999px",
                }}
              />
            </div>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: "18px",
                fontWeight: "bold",
                color: passportDesign.borderColor,
              }}
            >
              {stampCount} / {totalSpotCount} Stamp
            </p>
          </div>

          <p style={{ margin: "12px 0 0", fontSize: "14px" }}>
            {passportDesign.description}
          </p>
        </div>
      </div>

      <hr />

      <h2>Wallet</h2>
      <p>Symbolアドレス：{passport.wallet?.symbolAddress}</p>
      <hr />
      <button onClick={() => router.push("/scan")}>
        スタンプ取得画面へ
      </button>

      <br />
      <button onClick={() => router.push("/proposals")}>
        DAO投票画面へ
      </button>

      <br />
      <button onClick={() => router.push("/chat")}>
        チャット画面へ
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

      

      <hr />

      {/* <h2>SVG版 OC Passport</h2>
      <PassportCardSvg
        level={passportDesign.level}
        title={passportDesign.title}
        stampCount={stampCount}
        spots={passport.spots}
        visitedSpots={visitedSpots}
      />  */}
    </div>
  );
}


