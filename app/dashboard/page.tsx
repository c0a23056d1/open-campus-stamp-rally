"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildDnftMetadata } from "@/lib/dnftMetadata";

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

  if (!passport) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f8fafc" }}>
        読み込み中...
      </div>
    );
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
    : null;

  const passportDesign =
    stampCount >= 7
      ? {
          level: 4,
          label: "Level 4",
          title: "Campus Ambassador",
          borderColor: "#ec4899",
          backgroundColor: "#fdf2f8",
          badgeColor: "#db2777",
          description: "最大レベルです。DAO提案・投票・チャットを活用できます。",
        }
      : stampCount >= 5
      ? {
          level: 3,
          label: "Level 3",
          title: "Campus Member",
          borderColor: "#f59e0b",
          backgroundColor: "#fffbeb",
          badgeColor: "#d97706",
          description: "DAO投票の提案が可能になります。",
        }
      : stampCount >= 3
      ? {
          level: 2,
          label: "Level 2",
          title: "Research Supporter",
          borderColor: "#8b5cf6",
          backgroundColor: "#f5f3ff",
          badgeColor: "#7c3aed",
          description: "DAO投票機能が解放されます。",
        }
      : stampCount >= 1
      ? {
          level: 1,
          label: "Level 1",
          title: "Explorer",
          borderColor: "#3b82f6",
          backgroundColor: "#eff6ff",
          badgeColor: "#2563eb",
          description: "チャット機能が解放されます。",
        }
      : {
          level: 0,
          label: "Level 0",
          title: "Fresh Visitor",
          borderColor: "#d1d5db",
          backgroundColor: "#f9fafb",
          badgeColor: "#6b7280",
          description: "まずは研究室を訪問してスタンプを集めましょう。",
        };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "32px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <header
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                color: "#2563eb",
                fontWeight: "bold",
                fontSize: "14px",
                margin: "0 0 8px",
              }}
            >
              Open Campus Passport
            </p>
            <h1 style={{ margin: 0, color: "#0f172a", fontSize: "30px" }}>
              ダッシュボード
            </h1>
            <p style={{ margin: "10px 0 0", color: "#64748b" }}>
              {passport.user.name} さんのOC Passport情報です。
            </p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: "10px 18px",
              borderRadius: "999px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ログアウト
          </button>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(320px, 420px) 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <section
            style={{
              border: `4px solid ${passportDesign.borderColor}`,
              backgroundColor: passportDesign.backgroundColor,
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  borderRadius: "999px",
                  backgroundColor: passportDesign.badgeColor,
                  color: "#ffffff",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                {passportDesign.label}
              </span>

              <h2 style={{ margin: "18px 0 4px", color: "#0f172a" }}>
                OC Passport
              </h2>
              <h3 style={{ margin: 0, color: passportDesign.badgeColor }}>
                {passportDesign.title}
              </h3>
            </div>

            {dnftImageUrl ? (
              <div style={{ textAlign: "center", margin: "22px 0" }}>
                <img
                  src={dnftImageUrl}
                  alt="dNFT Passport"
                  style={{
                    width: "260px",
                    maxWidth: "100%",
                    borderRadius: "16px",
                    border: `2px solid ${passportDesign.borderColor}`,
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  height: "180px",
                  borderRadius: "16px",
                  border: `2px dashed ${passportDesign.borderColor}`,
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "22px 0",
                  color: "#64748b",
                  fontWeight: "bold",
                }}
              >
                OC Passport Image
              </div>
            )}

            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.75)",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid rgba(148,163,184,0.35)",
              }}
            >
              <p style={{ margin: "0 0 8px" }}>
                <strong>NFT ID：</strong>
                {passport.nft?.nftId}
              </p>
              <p style={{ margin: "0 0 8px" }}>
                <strong>現在のLevel：</strong>
                {passportDesign.level}
              </p>
              <p style={{ margin: "0 0 8px" }}>
                <strong>取得スタンプ：</strong>
                {stampCount}
              </p>
              <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>
                {passportDesign.description}
              </p>
            </div>
          </section>

          <main style={{ display: "grid", gap: "18px" }}>
            <section
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "22px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>アクション</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                }}
              >
                <button style={styles.primaryButton} onClick={() => router.push("/scan")}>
                  QRスタンプ取得
                </button>
                <button style={styles.secondaryButton} onClick={() => router.push("/proposals")}>
                  DAO投票
                </button>
                <button style={styles.secondaryButton} onClick={() => router.push("/chat")}>
                  チャット
                </button>
              </div>
            </section>

            <section
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "22px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>ユーザー情報</h2>
              <p>
                <strong>名前：</strong>
                {passport.user.name}
              </p>
              <p>
                <strong>メール：</strong>
                {passport.user.email}
              </p>
              <p style={{ wordBreak: "break-all" }}>
                <strong>Symbolアドレス：</strong>
                {passport.wallet?.symbolAddress ?? "未登録"}
              </p>
            </section>

            <section
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "22px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>取得スタンプ</h2>

              {passport.stamps.length === 0 ? (
                <p style={{ color: "#64748b" }}>
                  まだスタンプを取得していません。
                </p>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {passport.stamps.map((stamp) => (
                    <div
                      key={stamp.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "12px 14px",
                        backgroundColor: "#f8fafc",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <span>
                        <strong>{stamp.floor}</strong>：{stamp.spotName}
                      </span>
                      <span style={{ color: "#64748b", fontSize: "13px" }}>
                        {new Date(stamp.visitedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  primaryButton: {
    padding: "14px 18px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "14px 18px",
    borderRadius: "999px",
    border: "1px solid #2563eb",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    fontWeight: "bold",
    cursor: "pointer",
  },
};