"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ChatRoom = {
  id: number;
  roomName: string;
  description: string | null;
};

type ChatMessage = {
  id: number;
  messageText: string;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
  };
};

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();

  const roomId = params.roomId as string;

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `/api/chat/messages?userId=${userId}&roomId=${roomId}`
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        router.push("/chat");
        return;
      }

      setRoom(data.room);
      setMessages(data.messages);
    } catch (error) {
      console.error("メッセージ取得エラー:", error);
      alert("メッセージ取得中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSend = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
      return;
    }

    if (!messageText.trim()) {
      alert("メッセージを入力してください");
      return;
    }

    setSending(true);

    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        roomId,
        messageText,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      setSending(false);
      return;
    }

    setMessageText("");
    await fetchMessages();
    setSending(false);
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>読み込み中...</div>;
  }

  if (!room) {
    return <div style={{ padding: "20px" }}>チャットルームがありません</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <button onClick={() => router.push("/chat")}>
        チャットルーム一覧へ戻る
      </button>

      <h1>{room.roomName}</h1>
      <p>{room.description || "説明なし"}</p>

      <hr />

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "12px",
          padding: "16px",
          minHeight: "400px",
          maxHeight: "500px",
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        {messages.length === 0 ? (
          <p>まだメッセージはありません</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: "10px",
                padding: "10px 12px",
                marginBottom: "10px",
              }}
            >
              <div style={{ fontWeight: "bold" }}>
                {msg.user.name ?? "名無しユーザー"}
              </div>
              <div style={{ marginTop: "6px" }}>{msg.messageText}</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                {new Date(msg.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: "16px" }}>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="メッセージを入力してください"
          style={{
            width: "100%",
            height: "100px",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      <div style={{ marginTop: "12px" }}>
        <button onClick={handleSend} disabled={sending}>
          {sending ? "送信中..." : "送信する"}
        </button>
      </div>
    </div>
  );
}