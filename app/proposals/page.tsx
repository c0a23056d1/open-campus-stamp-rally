"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Vote = {
  id: number;
  proposalId: number;
  proposalOptionId: number;
  userId: number;
};

type ProposalOption = {
  id: number;
  label: string;
  sortOrder: number;
  votes: Vote[];
};

type Proposal = {
  id: number;
  title: string;
  description: string;
  requiredLevel: number;
  startAt: string;
  endAt: string;
  options: ProposalOption[];
  votes: Vote[];
  chatRoom: {
    id: number;
    roomName: string;
  } | null;
};

export default function ProposalsPage() {
  const router = useRouter();
  const [userLevel, setUserLevel] = useState(0);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>(
    {}
  );

  const fetchProposals = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
      return;
    }

    const res = await fetch(`/api/proposals?userId=${userId}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    setUserLevel(data.userLevel);
    setUserVotes(data.userVotes);
    setProposals(data.proposals);
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleVote = async (proposalId: number) => {
    const userId = localStorage.getItem("userId");
    const proposalOptionId = selectedOptions[proposalId];

    if (!proposalOptionId) {
      alert("選択肢を選んでください");
      return;
    }

    const res = await fetch("/api/votes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        proposalId,
        proposalOptionId,
      }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      fetchProposals();
    }
  };

  const hasVoted = (proposalId: number) => {
    return userVotes.some((vote) => vote.proposalId === proposalId);
  };

  const getTotalVotes = (proposal: Proposal) => {
    return proposal.options.reduce(
      (sum, option) => sum + option.votes.length,
      0
    );
  };

  const getPercent = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const getStatusLabel = (proposal: Proposal) => {
    const now = new Date();
    if (now < new Date(proposal.startAt)) return "開始前";
    if (now > new Date(proposal.endAt)) return "終了";
    return "投票受付中";
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
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
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
                color: "#7c3aed",
                fontWeight: "bold",
                fontSize: "14px",
                margin: "0 0 8px",
              }}
            >
              投票一覧
            </p>

            <h1 style={{ margin: 0, color: "#0f172a", fontSize: "30px" }}>
              投票画面
            </h1>
            <p style={{ margin: "8px 0 0", color: "#475569" }}>
              興味のあるものに投票してみましょう！
            </p>

            <p style={{ margin: "10px 0 0", color: "#64748b" }}>
              あなたのLevel：<strong>{userLevel}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {userLevel >= 3 && (
              <button
                onClick={() => router.push("/proposals/request")}
                style={styles.primaryButton}
              >
                Proposalを提案
              </button>
            )}

            <button
              onClick={() => router.push("/dashboard")}
              style={styles.outlineButton}
            >
              ダッシュボードへ戻る
            </button>
          </div>
        </header>

        {proposals.length === 0 ? (
          <section style={styles.emptyCard}>
            <h2 style={{ color: "#0f172a" }}>投票はまだありません</h2>
            <p>管理者がProposalを公開すると、ここに表示されます。</p>
          </section>
        ) : (
          <div style={{ display: "grid", gap: "18px" }}>
            {proposals.map((proposal) => {
              const canVote = userLevel >= proposal.requiredLevel;
              const voted = hasVoted(proposal.id);
              const totalVotes = getTotalVotes(proposal);
              const now = new Date();
              const isBeforeStart = now < new Date(proposal.startAt);
              const isAfterEnd = now > new Date(proposal.endAt);
              const statusLabel = getStatusLabel(proposal);

              return (
                <section key={proposal.id} style={styles.proposalCard}>
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
                            statusLabel === "投票受付中"
                              ? "#dcfce7"
                              : statusLabel === "開始前"
                              ? "#fef3c7"
                              : "#e5e7eb",
                          color:
                            statusLabel === "投票受付中"
                              ? "#166534"
                              : statusLabel === "開始前"
                              ? "#92400e"
                              : "#374151",
                        }}
                      >
                        {statusLabel}
                      </span>

                      <h2 style={{ margin: "12px 0 8px", color: "#0f172a" }}>
                        {proposal.title}
                      </h2>

                      <p
                        style={{
                          color: "#64748b",
                          lineHeight: 1.7,
                          margin: 0,
                        }}
                      >
                        {proposal.description}
                      </p>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        color: "#475569",
                        minWidth: "100px",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "13px" }}>総投票数</p>
                      <strong style={{ fontSize: "26px", color: "#7c3aed" }}>
                        {totalVotes}
                      </strong>
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
                  </div>

                  <div style={{ display: "grid", gap: "10px" }}>
                    {proposal.options.map((option) => {
                      const voteCount = option.votes.length;
                      const percent = getPercent(voteCount, totalVotes);
                      const selected =
                        selectedOptions[proposal.id] === option.id;

                      return (
                        <label
                          key={option.id}
                          style={{
                            ...styles.optionCard,
                            borderColor: selected ? "#7c3aed" : "#e5e7eb",
                            backgroundColor: selected ? "#f5f3ff" : "#ffffff",
                            opacity:
                              !canVote || voted || isBeforeStart || isAfterEnd
                                ? 0.75
                                : 1,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              alignItems: "center",
                            }}
                          >
                            <input
                              type="radio"
                              name={`proposal-${proposal.id}`}
                              value={option.id}
                              disabled={
                                !canVote || voted || isBeforeStart || isAfterEnd
                              }
                              checked={selected}
                              onChange={() =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [proposal.id]: option.id,
                                }))
                              }
                            />

                            <strong>{option.label}</strong>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginTop: "8px",
                              color: "#64748b",
                              fontSize: "14px",
                            }}
                          >
                            <span>{voteCount}票</span>
                            <span>{percent}%</span>
                          </div>

                          <div style={styles.progressBase}>
                            <div
                              style={{
                                ...styles.progressBar,
                                width: `${percent}%`,
                              }}
                            />
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    {!canVote && (
                      <p style={styles.warningText}>
                        この投票にはLevel {proposal.requiredLevel}以上が必要です。
                      </p>
                    )}
                    {isBeforeStart && (
                      <p style={styles.warningText}>
                        この投票はまだ開始されていません。
                      </p>
                    )}
                    {isAfterEnd && (
                      <p style={styles.warningText}>この投票は終了しています。</p>
                    )}
                    {voted && (
                      <p style={styles.successText}>このProposalには投票済みです。</p>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    {canVote && !voted && !isBeforeStart && !isAfterEnd && (
                      <button
                        onClick={() => handleVote(proposal.id)}
                        style={styles.primaryButton}
                      >
                        投票する
                      </button>
                    )}

                    {proposal.chatRoom && (
                      <button
                        onClick={() =>
                          router.push(`/chat/${proposal.chatRoom!.id}`)
                        }
                        style={styles.outlineButton}
                      >
                        この投票について話す
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  primaryButton: {
    padding: "10px 18px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  outlineButton: {
    padding: "10px 18px",
    borderRadius: "999px",
    border: "1px solid #7c3aed",
    backgroundColor: "#ffffff",
    color: "#7c3aed",
    fontWeight: "bold",
    cursor: "pointer",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "32px",
    textAlign: "center",
    color: "#64748b",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
  },
  proposalCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
  },
  statusBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "4px 14px",
    margin: "18px 0",
    color: "#475569",
    fontSize: "14px",
  },
  optionCard: {
    border: "2px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
    cursor: "pointer",
  },
  progressBase: {
    height: "9px",
    borderRadius: "999px",
    backgroundColor: "#e5e7eb",
    marginTop: "8px",
    overflow: "hidden",
  },
  progressBar: {
    height: "9px",
    borderRadius: "999px",
    backgroundColor: "#7c3aed",
  },
  warningText: {
    color: "#dc2626",
    fontWeight: "bold",
    margin: "6px 0",
  },
  successText: {
    color: "#16a34a",
    fontWeight: "bold",
    margin: "6px 0",
  },
};