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
    <div style={{ padding: "20px" }}>
      <h1>Proposal提案</h1>

      <button onClick={() => router.push("/proposals")}>
        投票一覧へ戻る
      </button>

      <hr />

      <p>Level 3以上のユーザーが投票テーマを提案できます。</p>

      <div>
        <label>タイトル</label>
        <br />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "420px" }}
        />
      </div>

      <br />

      <div>
        <label>説明</label>
        <br />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "420px", height: "100px" }}
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
          placeholder={`例：\n研究室A\n研究室B\n研究室C`}
        />
      </div>

      <br />

      <button onClick={handleSubmit}>提案する</button>
    </div>
  );
}