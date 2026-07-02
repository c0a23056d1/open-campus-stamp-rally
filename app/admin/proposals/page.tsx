"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Proposal = {
  id: number;
  title: string;
  description: string;
  requiredLevel: number;
  startAt: string;
  endAt: string;
  createdAt: string;
  status: string;
  creator: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  chatRoom: {
    id: number;
    roomName: string;
  } | null;
  options: {
    id: number;
    label: string;
    sortOrder: number;
    votes: {
      id: number;
    }[];
  }[];
  votes: {
    id: number;
  }[];
};

export default function AdminProposalsPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredLevel, setRequiredLevel] = useState(1);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const fetchProposals = async () => {
    const adminUserId = localStorage.getItem("userId");

    if (!adminUserId) {
      router.push("/login");
      return;
    }

    const res = await fetch(`/api/admin/proposals?adminUserId=${adminUserId}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      router.push("/dashboard");
      return;
    }

    setProposals(data.proposals);
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleCreateProposal = async () => {
    const adminUserId = localStorage.getItem("userId");

    const options = optionsText
      .split("\n")
      .map((option) => option.trim())
      .filter((option) => option.length > 0);

    const res = await fetch("/api/admin/proposals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminUserId,
        title,
        description,
        requiredLevel,
        startAt,
        endAt,
        options,
      }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      setTitle("");
      setDescription("");
      setRequiredLevel(1);
      setStartAt("");
      setEndAt("");
      setOptionsText("");
      fetchProposals();
    }
  };

  const handleApproveProposal = async (proposalId: number) => {
    const adminUserId = localStorage.getItem("userId");

    const ok = confirm("このProposalを承認しますか？");
    if (!ok) return;

    const res = await fetch("/api/admin/proposals/approve", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminUserId,
        proposalId,
      }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      fetchProposals();
    }
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
              DAO Governance
            </p>
            <h1 style={{ margin: 0, color: "#0f172a", fontSize: "30px" }}>
              Proposal管理
            </h1>
            <p style={{ margin: "10px 0 0", color: "#64748b" }}>
              投票テーマの作成、ユーザー提案の承認、議論ルーム管理を行います。
            </p>
          </div>

          <button
            onClick={() => router.push("/admin")}
            style={styles.outlineButton}
          >
            管理者トップへ戻る
          </button>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "380px 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Proposal作成</h2>

            <label style={styles.label}>タイトル</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              placeholder="例：人気展示投票"
            />

            <label style={styles.label}>説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...styles.input, height: "90px", resize: "vertical" }}
              placeholder="例：一番よかった展示を1つ選んでください"
            />

            <label style={styles.label}>必要Level</label>
            <select
              value={requiredLevel}
              onChange={(e) => setRequiredLevel(Number(e.target.value))}
              style={styles.input}
            >
              <option value={0}>Level 0以上</option>
              <option value={1}>Level 1以上</option>
              <option value={2}>Level 2以上</option>
              <option value={3}>Level 3以上</option>
              <option value={4}>Level 4以上</option>
            </select>

            <label style={styles.label}>開始日時</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>終了日時</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>選択肢（1行に1つ）</label>
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              style={{ ...styles.input, height: "120px", resize: "vertical" }}
              placeholder={`例：\nAI研究室\nセキュリティ研究室\nWeb研究室\nロボティクス研究室`}
            />

            <button onClick={handleCreateProposal} style={styles.primaryButton}>
              Proposalを作成
            </button>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Proposal一覧</h2>

            {proposals.length === 0 ? (
              <p style={{ color: "#64748b" }}>Proposalはまだありません</p>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {proposals.map((proposal) => (
                  <div key={proposal.id} style={styles.proposalCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor:
                              proposal.status === "pending"
                                ? "#fef3c7"
                                : "#dcfce7",
                            color:
                              proposal.status === "pending"
                                ? "#92400e"
                                : "#166534",
                          }}
                        >
                          {proposal.status === "pending"
                            ? "承認待ち"
                            : "承認済み"}
                        </span>

                        <h3 style={{ margin: "10px 0 6px", color: "#0f172a" }}>
                          {proposal.title}
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            color: "#64748b",
                            lineHeight: 1.6,
                          }}
                        >
                          {proposal.description}
                        </p>
                      </div>

                      <div style={{ textAlign: "right", color: "#475569" }}>
                        <strong>{proposal.votes.length}</strong> 票
                      </div>
                    </div>

                    <div style={styles.metaGrid}>
                      <p>
                        <strong>必要Level：</strong>
                        {proposal.requiredLevel}
                      </p>
                      <p>
                        <strong>開始：</strong>
                        {new Date(proposal.startAt).toLocaleString()}
                      </p>
                      <p>
                        <strong>終了：</strong>
                        {new Date(proposal.endAt).toLocaleString()}
                      </p>
                      <p>
                        <strong>作成者：</strong>
                        {proposal.creator
                          ? proposal.creator.name || proposal.creator.email
                          : "管理者"}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ marginBottom: "8px" }}>選択肢</h4>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {proposal.options.map((option) => (
                          <div key={option.id} style={styles.optionRow}>
                            <span>{option.label}</span>
                            <strong>{option.votes.length}票</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "16px",
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {proposal.status === "pending" && (
                        <button
                          onClick={() => handleApproveProposal(proposal.id)}
                          style={styles.primaryButtonSmall}
                        >
                          承認する
                        </button>
                      )}

                      {proposal.chatRoom && (
                        <button
                          onClick={() =>
                            router.push(`/admin/chat/${proposal.chatRoom!.id}`)
                          }
                          style={styles.outlineButtonSmall}
                        >
                          議論ルームを管理
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "18px",
    color: "#0f172a",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    color: "#334155",
    marginBottom: "6px",
    marginTop: "12px",
  },
  input: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    fontSize: "14px",
  },
  primaryButton: {
    width: "100%",
    marginTop: "18px",
    padding: "12px 16px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  primaryButtonSmall: {
    padding: "9px 16px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
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
  outlineButtonSmall: {
    padding: "9px 16px",
    borderRadius: "999px",
    border: "1px solid #2563eb",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    fontWeight: "bold",
    cursor: "pointer",
  },
  proposalCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    backgroundColor: "#f8fafc",
  },
  statusBadge: {
    display: "inline-block",
    padding: "5px 11px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "4px 14px",
    margin: "14px 0",
    color: "#475569",
    fontSize: "14px",
  },
  optionRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "10px 12px",
  },
};