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
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, number>
  >({});

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

  return (
    <div style={{ padding: "20px" }}>
      <h1>DAO投票</h1>

      <button onClick={() => router.push("/dashboard")}>
        ダッシュボードへ戻る
      </button>

      <p>あなたのLevel：{userLevel}</p>

      <hr />

      {proposals.length === 0 ? (
        <p>投票はまだありません</p>
      ) : (
        proposals.map((proposal) => {
          const canVote = userLevel >= proposal.requiredLevel;
          const voted = hasVoted(proposal.id);
          const totalVotes = getTotalVotes(proposal);
          const now = new Date();
          const isBeforeStart = now < new Date(proposal.startAt);
          const isAfterEnd = now > new Date(proposal.endAt);

          return (
            <div
              key={proposal.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <h2>{proposal.title}</h2>
              <p>{proposal.description}</p>
              <p>必要Level：{proposal.requiredLevel}</p>
              <p>開始：{new Date(proposal.startAt).toLocaleString()}</p>
              <p>終了：{new Date(proposal.endAt).toLocaleString()}</p>
              <p>総投票数：{totalVotes}</p>

              <h3>選択肢</h3>

              {proposal.options.map((option) => {
                const voteCount = option.votes.length;
                const percent = getPercent(voteCount, totalVotes);

                return (
                  <label
                    key={option.id}
                    style={{
                      display: "block",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <input
                      type="radio"
                      name={`proposal-${proposal.id}`}
                      value={option.id}
                      disabled={!canVote || voted || isBeforeStart || isAfterEnd}
                      checked={selectedOptions[proposal.id] === option.id}
                      onChange={() =>
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [proposal.id]: option.id,
                        }))
                      }
                    />

                    <span style={{ marginLeft: "8px" }}>
                      {option.label}：{voteCount}票 / {percent}%
                    </span>

                    <div
                      style={{
                        background: "#eee",
                        height: "8px",
                        borderRadius: "999px",
                        marginTop: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: "8px",
                          borderRadius: "999px",
                          background: "#7c3aed",
                        }}
                      />
                    </div>
                  </label>
                );
              })}

              {!canVote && (
                <p style={{ color: "red" }}>
                  この投票にはLevel {proposal.requiredLevel}以上が必要です
                </p>
              )}

              {isBeforeStart && <p>この投票はまだ開始されていません</p>}
              {isAfterEnd && <p>この投票は終了しています</p>}
              {voted && <p>投票済みです</p>}

              {canVote && !voted && !isBeforeStart && !isAfterEnd && (
                <button onClick={() => handleVote(proposal.id)}>
                  投票する
                </button>
              )}

              {proposal.chatRoom && (
                <button
                  onClick={() => router.push(`/chat/${proposal.chatRoom!.id}`)}
                  style={{ marginLeft: "10px" }}
                >
                  この投票について話す
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}