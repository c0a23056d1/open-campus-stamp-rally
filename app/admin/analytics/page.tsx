"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AnalyticsData = {
  overview: {
    totalUsers: number;
    totalStampLogs: number;
    usersVisitedMultipleSpots: number;
    multipleVisitRate: number;
  };
  circulation: {
    spotVisitRanking: {
      id: number;
      spotName: string;
      floor: string;
      visitCount: number;
    }[];
    firstVisitSpots: {
      spotName: string;
      count: number;
    }[];
  };
  communication: {
    totalMessages: number;
    chatUserCount: number;
    roomMessageCounts: {
      roomId: number;
      roomName: string;
      messageCount: number;
    }[];
    userMessageRanking: {
      userId: number;
      name: string | null;
      email: string;
      messageCount: number;
    }[];
  };
  dao: {
    totalProposals: number;
    pendingProposals: number;
    approvedProposals: number;
    totalVotes: number;
    votedUserCount: number;
    proposalCreatorUserCount: number;
  };
  continuity: {
    usersWithLoginHistory: number;
    active7Days: number;
    active14Days: number;
    active30Days: number;
    active7DaysRate: number;
    active14DaysRate: number;
    active30DaysRate: number;
  };
  level: {
    levelDistribution: {
      level: number;
      userCount: number;
    }[];
    levelActivity: {
      level: number;
      userCount: number;
      messageCount: number;
      voteCount: number;
      proposalCount: number;
    }[];
  };
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const adminUserId = localStorage.getItem("userId");

      if (!adminUserId) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `/api/admin/advanced-analytics?adminUserId=${adminUserId}`
      );
      const json = await res.json();

      if (!res.ok) {
        alert(json.message);
        router.push("/admin");
        return;
      }

      setData(json);
    };

    fetchAnalytics();
  }, [router]);

  if (!data) {
    return <div style={{ padding: "24px" }}>読み込み中...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.headerCard}>
          <div>
            <p style={styles.kicker}>Analytics</p>
            <h1 style={styles.pageTitle}>分析ダッシュボード</h1>
            <p style={styles.subtitle}>
              スタンプ取得、回遊、交流、DAO参加状況を確認できます。
            </p>
          </div>

          <button onClick={() => router.push("/admin")} style={styles.outlineButton}>
            管理者トップへ戻る
          </button>
        </header>

        <div style={styles.summaryGrid}>
          <SummaryCard title="登録ユーザー数" value={data.overview.totalUsers} />
          <SummaryCard title="総スタンプ取得数" value={data.overview.totalStampLogs} />
          <SummaryCard title="複数スポット訪問者" value={data.overview.usersVisitedMultipleSpots} />
          <SummaryCard title="複数訪問率" value={`${data.overview.multipleVisitRate}%`} />
        </div>

        <section style={styles.card}>
          <h2>回遊分析</h2>
          <h3>スポット別訪問数</h3>
          {data.circulation.spotVisitRanking.map((spot) => (
            <BarRow
              key={spot.id}
              label={`${spot.floor}：${spot.spotName}`}
              value={spot.visitCount}
              max={Math.max(
                1,
                ...data.circulation.spotVisitRanking.map((s) => s.visitCount)
              )}
              suffix="件"
            />
          ))}

          <h3 style={{ marginTop: "24px" }}>最初に訪問されたスポット</h3>
          {data.circulation.firstVisitSpots.length === 0 ? (
            <p style={styles.emptyText}>まだ訪問データがありません。</p>
          ) : (
            data.circulation.firstVisitSpots.map((spot) => (
              <BarRow
                key={spot.spotName}
                label={spot.spotName}
                value={spot.count}
                max={Math.max(
                  1,
                  ...data.circulation.firstVisitSpots.map((s) => s.count)
                )}
                suffix="人"
              />
            ))
          )}
        </section>

        <section style={styles.card}>
          <h2>交流分析</h2>

          <div style={styles.summaryGrid}>
            <SummaryCard title="総メッセージ数" value={data.communication.totalMessages} />
            <SummaryCard title="チャット参加者数" value={data.communication.chatUserCount} />
          </div>

          <h3>ルーム別メッセージ数</h3>
          {data.communication.roomMessageCounts.map((room) => (
            <BarRow
              key={room.roomId}
              label={room.roomName}
              value={room.messageCount}
              max={Math.max(
                1,
                ...data.communication.roomMessageCounts.map((r) => r.messageCount)
              )}
              suffix="件"
            />
          ))}

          <h3 style={{ marginTop: "24px" }}>ユーザー別投稿数</h3>
          {data.communication.userMessageRanking.length === 0 ? (
            <p style={styles.emptyText}>まだ投稿はありません。</p>
          ) : (
            data.communication.userMessageRanking.map((user) => (
              <BarRow
                key={user.userId}
                label={user.name || user.email}
                value={user.messageCount}
                max={Math.max(
                  1,
                  ...data.communication.userMessageRanking.map(
                    (u) => u.messageCount
                  )
                )}
                suffix="件"
              />
            ))
          )}
        </section>

        <section style={styles.card}>
          <h2>継続的関係形成分析</h2>

          <div style={styles.summaryGrid}>
            <SummaryCard
              title="ログイン履歴あり"
              value={data.continuity.usersWithLoginHistory}
            />
            <SummaryCard
              title="直近7日アクセス"
              value={`${data.continuity.active7Days}人`}
            />
            <SummaryCard
              title="直近14日アクセス"
              value={`${data.continuity.active14Days}人`}
            />
            <SummaryCard
              title="直近30日アクセス"
              value={`${data.continuity.active30Days}人`}
            />
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>期間</th>
                <th style={styles.th}>アクセス人数</th>
                <th style={styles.th}>継続利用率</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}>直近7日</td>
                <td style={styles.td}>{data.continuity.active7Days}人</td>
                <td style={styles.td}>{data.continuity.active7DaysRate}%</td>
              </tr>
              <tr>
                <td style={styles.td}>直近14日</td>
                <td style={styles.td}>{data.continuity.active14Days}人</td>
                <td style={styles.td}>{data.continuity.active14DaysRate}%</td>
              </tr>
              <tr>
                <td style={styles.td}>直近30日</td>
                <td style={styles.td}>{data.continuity.active30Days}人</td>
                <td style={styles.td}>{data.continuity.active30DaysRate}%</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style={styles.card}>
          <h2>DAO参加分析</h2>

          <div style={styles.summaryGrid}>
            <SummaryCard title="Proposal数" value={data.dao.totalProposals} />
            <SummaryCard title="承認済み" value={data.dao.approvedProposals} />
            <SummaryCard title="承認待ち" value={data.dao.pendingProposals} />
            <SummaryCard title="総投票数" value={data.dao.totalVotes} />
            <SummaryCard title="投票参加者数" value={data.dao.votedUserCount} />
            <SummaryCard title="提案者数" value={data.dao.proposalCreatorUserCount} />
          </div>
        </section>

        <section style={styles.card}>
          <h2>Level分析</h2>

          <h3>Level別ユーザー数</h3>
          {data.level.levelDistribution.map((row) => (
            <BarRow
              key={row.level}
              label={`Level ${row.level}`}
              value={row.userCount}
              max={Math.max(
                1,
                ...data.level.levelDistribution.map((r) => r.userCount)
              )}
              suffix="人"
            />
          ))}

          <h3 style={{ marginTop: "24px" }}>Level別活動量</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Level</th>
                <th style={styles.th}>人数</th>
                <th style={styles.th}>投稿数</th>
                <th style={styles.th}>投票数</th>
                <th style={styles.th}>提案数</th>
              </tr>
            </thead>
            <tbody>
              {data.level.levelActivity.map((row) => (
                <tr key={row.level}>
                  <td style={styles.td}>Level {row.level}</td>
                  <td style={styles.td}>{row.userCount}</td>
                  <td style={styles.td}>{row.messageCount}</td>
                  <td style={styles.td}>{row.voteCount}</td>
                  <td style={styles.td}>{row.proposalCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div style={styles.summaryCard}>
      <p style={styles.summaryLabel}>{title}</p>
      <strong style={styles.summaryNumber}>{value}</strong>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  suffix: string;
}) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);

  return (
    <div style={styles.barRow}>
      <div style={styles.barHeader}>
        <strong>{label}</strong>
        <span>
          {value}
          {suffix}
        </span>
      </div>
      <div style={styles.barBase}>
        <div style={{ ...styles.bar, width: `${percent}%` }} />
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
    maxWidth: "1180px",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
  },
  summaryLabel: {
    margin: 0,
    color: "#64748b",
    fontWeight: "bold",
    fontSize: "14px",
  },
  summaryNumber: {
    display: "block",
    marginTop: "8px",
    fontSize: "30px",
    color: "#2563eb",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
  },
  barRow: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "12px",
    marginBottom: "10px",
    backgroundColor: "#f8fafc",
  },
  barHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "8px",
    color: "#334155",
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
  emptyText: {
    color: "#64748b",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    borderBottom: "1px solid #e5e7eb",
    padding: "10px",
    textAlign: "left",
    backgroundColor: "#f8fafc",
    color: "#334155",
  },
  td: {
    borderBottom: "1px solid #e5e7eb",
    padding: "10px",
    color: "#475569",
  },
};