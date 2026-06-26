"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProposalOption = {
  id: number;
  label: string;
  sortOrder: number;
  votes: {
    id: number;
  }[];
};

type Proposal = {
  id: number;
  title: string;
  description: string;
  requiredLevel: number;
  startAt: string;
  endAt: string;
  createdAt: string;
  options: ProposalOption[];
  votes: {
    id: number;
  }[];
  chatRoom: {
    id: number;
    roomName: string;
  } | null;
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

    const res = await fetch(
      `/api/admin/proposals?adminUserId=${adminUserId}`
    );
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

  return (
    <div style={{ padding: "20px" }}>
      <h1>Proposal管理</h1>

      <button onClick={() => router.push("/admin")}>
        管理者トップへ戻る
      </button>

      <hr />

      <h2>Proposal作成</h2>

      <div>
        <label>タイトル</label>
        <br />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "420px" }}
          placeholder="例：人気展示投票"
        />
      </div>

      <br />

      <div>
        <label>説明</label>
        <br />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "420px", height: "90px" }}
          placeholder="例：一番よかった展示を1つ選んでください"
        />
      </div>

      <br />

      <div>
        <label>必要Level</label>
        <br />
        <select
          value={requiredLevel}
          onChange={(e) => setRequiredLevel(Number(e.target.value))}
        >
          <option value={0}>Level 0以上</option>
          <option value={1}>Level 1以上</option>
          <option value={2}>Level 2以上</option>
          <option value={3}>Level 3以上</option>
          <option value={4}>Level 4以上</option>
        </select>
      </div>

      <br />

      <div>
        <label>開始日時</label>
        <br />
        <input
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
        />
      </div>

      <br />

      <div>
        <label>終了日時</label>
        <br />
        <input
          type="datetime-local"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
        />
      </div>

      <br />

      <div>
        <label>選択肢（1行に1つ）</label>
        <br />
        <textarea
          value={optionsText}
          onChange={(e) => setOptionsText(e.target.value)}
          style={{ width: "420px", height: "120px" }}
          placeholder={`例：\nAI研究室\nセキュリティ研究室\nWeb研究室\nロボティクス研究室`}
        />
      </div>

      <br />

      <button onClick={handleCreateProposal}>作成</button>

      <hr />

      <h2>Proposal一覧</h2>

      {proposals.length === 0 ? (
        <p>Proposalはまだありません</p>
      ) : (
        proposals.map((proposal) => (
          <div
            key={proposal.id}
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "12px",
            }}
          >
            <h3>{proposal.title}</h3>
            <p>{proposal.description}</p>
            <p>必要Level：{proposal.requiredLevel}</p>
            <p>開始：{new Date(proposal.startAt).toLocaleString()}</p>
            <p>終了：{new Date(proposal.endAt).toLocaleString()}</p>
            <p>投票数：{proposal.votes.length}</p>

            <h4>選択肢</h4>
            <ul>
              {proposal.options.map((option) => (
                <li key={option.id}>
                  {option.label}：{option.votes.length}票
                </li>
              ))}
            </ul>

            {proposal.chatRoom && (
              <button onClick={() => router.push(`/admin/chat/${proposal.chatRoom!.id}`)}>
                議論ルームを管理
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}