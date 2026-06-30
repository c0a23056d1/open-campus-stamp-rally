"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");

  const [analytics, setAnalytics] = useState<{
    totalUsers: number;
    stampDistribution: {
      stampCount: number;
      userCount: number;
    }[];
  } | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
      return;
    }

    const checkAdmin = async () => {
      const res = await fetch(`/api/admin/check?userId=${userId}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        router.push("/dashboard");
        return;
      }

      setAdminName(data.user.name);

      const analyticsRes = await fetch(
        `/api/admin/analytics?adminUserId=${userId}`
      );
      const analyticsData = await analyticsRes.json();

      if (analyticsRes.ok) {
        setAnalytics(analyticsData);
      }
    };

    checkAdmin();
  }, [router]);

  const menuItems = [
    {
      title: "QR発行",
      description: "研究室・展示スポットを登録し、スタンプ取得用QRコードを発行します。",
      path: "/admin/spots",
    },
    {
      title: "ユーザー管理",
      description: "登録ユーザー、Wallet、NFT、スタンプ取得状況を確認します。",
      path: "/admin/users",
    },
    {
      title: "Proposal管理",
      description: "投票テーマの作成、ユーザー提案の承認、議論ルーム管理を行います。",
      path: "/admin/proposals",
    },
    {
      title: "チャット管理",
      description: "チャットルームの作成、メッセージ確認・削除を行います。",
      path: "/admin/chat",
    },
    {
      title: "スポット分析",
      description: "スポット別訪問数や参加者の回遊状況を確認します。（未実装）",
      path: null,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "32px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          <p
            style={{
              color: "#64748b",
              margin: "0 0 8px",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            Open Campus Stamp Rally
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              color: "#0f172a",
            }}
          >
            管理者トップ画面
          </h1>

          <p
            style={{
              marginTop: "12px",
              marginBottom: 0,
              color: "#475569",
            }}
          >
            {adminName} さん、管理者としてログイン中です。
          </p>
        </div>

        {analytics && (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>スタンプ取得状況</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                gap: "20px",
                alignItems: "start",
              }}
            >
              <div
                style={{
                  backgroundColor: "#eff6ff",
                  borderRadius: "16px",
                  padding: "20px",
                  textAlign: "center",
                  border: "1px solid #bfdbfe",
                }}
              >
                <p style={{ margin: 0, color: "#2563eb", fontWeight: "bold" }}>
                  登録ユーザー数
                </p>
                <p
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    margin: "8px 0 0",
                    color: "#1d4ed8",
                  }}
                >
                  {analytics.totalUsers}
                </p>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  backgroundColor: "#ffffff",
                }}
              >
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>取得スタンプ数</th>
                    <th style={tableHeaderStyle}>人数</th>
                    <th style={tableHeaderStyle}>割合</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.stampDistribution.map((row) => {
                    const percent = 
                      analytics.totalUsers === 0
                        ? 0
                        : Math.round((row.userCount / analytics.totalUsers) * 100);
                    return (
                      <tr key={row.stampCount}>
                        <td style={tableCellStyle}>{row.stampCount}個</td>
                        <td style={tableCellStyle}>{row.userCount}人</td>
                        <td style={tableCellStyle}>{percent}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {menuItems.map((item) => (
            <div
              key={item.title}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                opacity: item.path ? 1 : 0.6,
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  marginTop: 0,
                  marginBottom: "8px",
                  color: "#0f172a",
                }}
              >
                {item.title}
              </h2>

              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  lineHeight: 1.6,
                  minHeight: "68px",
                }}
              >
                {item.description}
              </p>

              {item.path ? (
                <button
                  onClick={() => router.push(item.path)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "999px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  開く
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "999px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#f1f5f9",
                    color: "#64748b",
                    fontWeight: "bold",
                    cursor: "not-allowed",
                  }}
                >
                  未実装
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  borderBottom: "1px solid #e5e7eb",
  padding: "10px",
  textAlign: "left",
  backgroundColor: "#f8fafc",
  color: "#334155",
};

const tableCellStyle: React.CSSProperties = {
  borderBottom: "1px solid #e5e7eb",
  padding: "10px",
  color: "#475569",
};