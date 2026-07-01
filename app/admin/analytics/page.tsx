"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SpotAnalytics = {
  id: number;
  spotName: string;
  floor: string;
  visitCount: number;
  percent: number;
};

export default function AdminAnalyticsPage() {
  const router = useRouter();

  const [data, setData] = useState<{
    totalSpots: number;
    totalVisits: number;
    spotAnalytics: SpotAnalytics[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    const adminUserId = localStorage.getItem("userId");

    if (!adminUserId) {
      router.push("/login");
      return;
    }

    const res = await fetch(
      `/api/admin/spot-analytics?adminUserId=${adminUserId}`
    );
    const json = await res.json();

    if (!res.ok) {
      alert(json.message);
      router.push("/admin");
      return;
    }

    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div style={{ padding: "24px" }}>読み込み中...</div>;
  }

  if (!data) {
    return <div style={{ padding: "24px" }}>データがありません</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.headerCard}>
          <div>
            <p style={styles.kicker}>Spot Analytics</p>
            <h1 style={styles.pageTitle}>スポット分析</h1>
            <p style={styles.subtitle}>
              各研究室・展示スポットの訪問数を確認できます。
            </p>
          </div>

          <button onClick={() => router.push("/admin")} style={styles.outlineButton}>
            管理者トップへ戻る
          </button>
        </header>

        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>登録スポット数</p>
            <strong style={styles.summaryNumber}>{data.totalSpots}</strong>
          </div>

          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>総スタンプ取得数</p>
            <strong style={styles.summaryNumber}>{data.totalVisits}</strong>
          </div>
        </div>

        <section style={styles.card}>
          <h2 style={{ marginTop: 0 }}>スポット別訪問数</h2>

          {data.spotAnalytics.length === 0 ? (
            <p style={{ color: "#64748b" }}>スポットがまだ登録されていません。</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {data.spotAnalytics.map((spot) => (
                <div key={spot.id} style={styles.spotRow}>
                  <div>
                    <strong>
                      {spot.floor}：{spot.spotName}
                    </strong>
                    <p style={styles.smallText}>
                      訪問数：{spot.visitCount}件 / 全体の{spot.percent}%
                    </p>
                  </div>

                  <div style={styles.barBase}>
                    <div
                      style={{
                        ...styles.bar,
                        width: `${spot.percent}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    padding: "32px",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  headerCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  kicker: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: "14px",
    margin: "0 0 8px",
  },
  pageTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "30px",
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#64748b",
  },
  outlineButton: {
    padding: "10px 18px",
    borderRadius: "999px",
    border: "1px solid #2563eb",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    fontWeight: "bold",
    cursor: "pointer",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
  },
  summaryLabel: {
    margin: 0,
    color: "#64748b",
    fontWeight: "bold",
  },
  summaryNumber: {
    display: "block",
    marginTop: "8px",
    fontSize: "34px",
    color: "#2563eb",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
  },
  spotRow: {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
    backgroundColor: "#f8fafc",
  },
  smallText: {
    margin: "6px 0 10px",
    color: "#64748b",
    fontSize: "14px",
  },
  barBase: {
    height: "10px",
    borderRadius: "999px",
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  bar: {
    height: "10px",
    borderRadius: "999px",
    backgroundColor: "#2563eb",
  },
};