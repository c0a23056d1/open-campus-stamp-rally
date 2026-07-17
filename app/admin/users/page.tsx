"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  wallet: {
    symbolAddress: string;
  } | null;
  nft: {
    nftId: string;
    level: number;
    title: string | null;
    stampCount: number;
    mosaicId: string | null;
    issueTxHash: string | null;
    issueAt: string | null;
    metadataTxHash: string | null;
    metadataUpdatedAt: string | null;
    imageUrl: string | null;
  } | null;
  stampLogs: {
    id: number;
    visitedAt: string;
    spot: {
      spotName: string;
      floor: string;
    };
  }[];
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const adminUserId = localStorage.getItem("userId");

    if (!adminUserId) {
      router.push("/login");
      return;
    }

    const res = await fetch(`/api/admin/users?adminUserId=${adminUserId}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      router.push("/login");
      return;
    }

    setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleReissueNft = async (targetUserId: number) => {
    const adminUserId = localStorage.getItem("userId");

    const ok = confirm("このユーザーに初期NFTを再付与しますか？");
    if (!ok) return;

    const res = await fetch("/api/admin/users/reissue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminUserId,
        targetUserId,
      }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      fetchUsers();
    }
  };

  const handleResendMetadata = async (targetUserId: number) => {
    const adminUserId = localStorage.getItem("userId");

    const ok = confirm("このユーザーのMetadataを再送信しますか？");
    if (!ok) return;

    const res = await fetch("/api/admin/users/resend-metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminUserId,
        targetUserId,
      }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      fetchUsers();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f8fafc" }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.headerCard}>
          <div>
            <p style={styles.kicker}>Admin Console</p>
            <h1 style={styles.pageTitle}>ユーザー管理</h1>
            <p style={styles.subtitle}>
              登録ユーザー、Wallet、NFT、スタンプ取得状況を確認できます。
            </p>
          </div>

          <button onClick={() => router.push("/admin")} style={styles.outlineButton}>
            管理者トップへ戻る
          </button>
        </header>

        <section style={styles.summaryCard}>
          <span style={styles.summaryLabel}>登録ユーザー数</span>
          <strong style={styles.summaryNumber}>{users.length}</strong>
        </section>

        <div style={styles.userGrid}>
          {users.map((user) => (
            <article key={user.id} style={styles.userCard}>
              <div style={styles.userHeader}>
                <div>
                  <h2 style={styles.userName}>
                    {user.name}
                    {user.isAdmin && <span style={styles.adminBadge}>管理者</span>}
                  </h2>
                  <p style={styles.userEmail}>{user.email}</p>
                </div>

                <span style={styles.userIdBadge}>ID: {user.id}</span>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <p style={styles.infoLabel}>登録日</p>
                  <p style={styles.infoValue}>
                    {new Date(user.createdAt).toLocaleString()}
                  </p>
                </div>

                <div style={styles.infoBox}>
                  <p style={styles.infoLabel}>スタンプ数</p>
                  <p style={styles.infoValue}>{user.nft?.stampCount ?? 0}</p>
                </div>

                <div style={styles.infoBox}>
                  <p style={styles.infoLabel}>Level</p>
                  <p style={styles.infoValue}>{user.nft?.level ?? "未登録"}</p>
                </div>

                <div style={styles.infoBox}>
                  <p style={styles.infoLabel}>称号</p>
                  <p style={styles.infoValue}>{user.nft?.title || "未登録"}</p>
                </div>
              </div>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Wallet</h3>
                <p style={styles.monoText}>
                  {user.wallet?.symbolAddress || "未登録"}
                </p>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>NFT情報</h3>

                {user.nft ? (
                  <>
                    <div style={styles.detailList}>
                      <p>
                        <strong>NFT ID：</strong>
                        {user.nft.nftId}
                      </p>
                      <p>
                        <strong>Mosaic ID：</strong>
                        {user.nft.mosaicId || "未登録"}
                      </p>
                      <p>
                        <strong>初期NFT TxHash：</strong>
                        <span style={styles.breakText}>
                          {user.nft.issueTxHash || "未登録"}
                        </span>
                      </p>
                      <p>
                        <strong>Metadata TxHash：</strong>
                        <span style={styles.breakText}>
                          {user.nft.metadataTxHash || "未登録"}
                        </span>
                      </p>
                      <p>
                        <strong>Metadata更新日：</strong>
                        {user.nft.metadataUpdatedAt
                          ? new Date(user.nft.metadataUpdatedAt).toLocaleString()
                          : "未登録"}
                      </p>
                    </div>

                    <div style={styles.actionRow}>
                      <button
                        onClick={() => handleReissueNft(user.id)}
                        style={styles.dangerOutlineButton}
                      >
                        初期NFT再付与
                      </button>

                      <button
                        onClick={() => handleResendMetadata(user.id)}
                        style={styles.primaryButton}
                      >
                        Metadata再送信
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={styles.emptyText}>NFT情報がありません</p>
                )}
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>取得スタンプ</h3>

                {user.stampLogs.length === 0 ? (
                  <p style={styles.emptyText}>未取得</p>
                ) : (
                  <div style={styles.stampList}>
                    {user.stampLogs.map((log) => (
                      <div key={log.id} style={styles.stampItem}>
                        <span>
                          <strong>{log.spot.floor}</strong>：{log.spot.spotName}
                        </span>
                        <span style={styles.stampDate}>
                          {new Date(log.visitedAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </article>
          ))}
        </div>
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
  summaryCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px 22px",
    marginBottom: "20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: "#64748b",
    fontWeight: "bold",
  },
  summaryNumber: {
    fontSize: "28px",
    color: "#2563eb",
  },
  userGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "18px",
  },
  userCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
  },
  userHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  userName: {
    margin: 0,
    color: "#0f172a",
    fontSize: "22px",
  },
  userEmail: {
    margin: "6px 0 0",
    color: "#64748b",
  },
  adminBadge: {
    marginLeft: "8px",
    padding: "4px 9px",
    borderRadius: "999px",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: "12px",
    fontWeight: "bold",
  },
  userIdBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "bold",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    marginBottom: "16px",
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "12px",
  },
  infoLabel: {
    margin: "0 0 6px",
    color: "#64748b",
    fontSize: "13px",
  },
  infoValue: {
    margin: 0,
    color: "#0f172a",
    fontWeight: "bold",
    wordBreak: "break-all",
  },
  section: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "14px",
    marginTop: "14px",
  },
  sectionTitle: {
    margin: "0 0 10px",
    color: "#0f172a",
  },
  monoText: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "10px",
    wordBreak: "break-all",
    fontFamily: "monospace",
    color: "#334155",
  },
  detailList: {
    color: "#334155",
    lineHeight: 1.7,
    fontSize: "14px",
  },
  breakText: {
    wordBreak: "break-all",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "14px",
  },
  primaryButton: {
    padding: "9px 15px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  dangerOutlineButton: {
    padding: "9px 15px",
    borderRadius: "999px",
    border: "1px solid #dc2626",
    backgroundColor: "#ffffff",
    color: "#dc2626",
    fontWeight: "bold",
    cursor: "pointer",
  },
  emptyText: {
    color: "#64748b",
    margin: 0,
  },
  stampList: {
    display: "grid",
    gap: "8px",
  },
  stampItem: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "10px 12px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  stampDate: {
    color: "#64748b",
    fontSize: "13px",
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
};