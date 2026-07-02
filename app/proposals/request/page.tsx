"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProposalRequestPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredLevel, setRequiredLevel] = useState(1);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [optionsText, setOptionsText] = useState("");

  const handleSubmit = async () => {
    const userId = localStorage.getItem("userId");

    const options = optionsText
      .split("\n")
      .map((option) => option.trim())
      .filter((option) => option.length > 0);

    const res = await fetch("/api/proposals/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
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
      router.push("/proposals");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <section style={styles.headerCard}>
          <p style={styles.kicker}>DAO Governance</p>
          <h1 style={styles.title}>投票テーマ提案</h1>
          <p style={styles.subtitle}>
            Level3以上になると、投票テーマを提案できます。
            管理者が承認するとDAO投票として公開されます。
          </p>

          <button onClick={() => router.push("/proposals")} style={styles.outlineButton}>
            ← 投票一覧へ戻る
          </button>
        </section>

        <section style={styles.formCard}>
          <label style={styles.label}>タイトル</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
            placeholder="例：次回オープンキャンパスで見たい企画"
          />

          <label style={styles.label}>説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...styles.input, height: "110px", resize: "vertical" }}
            placeholder="例：参加者が次回見たい展示や企画を選ぶ投票です。"
          />

          <label style={styles.label}>必要Level</label>
          <select
            value={requiredLevel}
            onChange={(e) => setRequiredLevel(Number(e.target.value))}
            style={styles.input}
          >
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
            style={{ ...styles.input, height: "130px", resize: "vertical" }}
            placeholder={`例：\n研究室A\n研究室B\n研究室C`}
          />

          <button onClick={handleSubmit} style={styles.primaryButton}>
            Proposalを提案する
          </button>
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
    maxWidth: "800px",
    margin: "0 auto",
  },
  headerCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
    marginBottom: "24px",
    border: "1px solid #e5e7eb",
  },
  kicker: {
    color: "#7c3aed",
    fontWeight: "bold",
    margin: 0,
    fontSize: "14px",
  },
  title: {
    marginTop: "8px",
    marginBottom: "8px",
    color: "#0f172a",
  },
  subtitle: {
    color: "#64748b",
    lineHeight: 1.7,
  },
  formCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    color: "#334155",
    marginBottom: "6px",
    marginTop: "14px",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    fontSize: "14px",
  },
  primaryButton: {
    marginTop: "24px",
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "999px",
    background: "#7c3aed",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
  },
  outlineButton: {
    marginTop: "10px",
    padding: "10px 18px",
    borderRadius: "999px",
    border: "1px solid #7c3aed",
    background: "#fff",
    color: "#7c3aed",
    cursor: "pointer",
    fontWeight: "bold",
  },
};