"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ChatReaction = {
  id: number;
  emoji: string;
  userId: number;
};

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
  replyToMessage?: {
    id: number;
    messageText: string;
    user: {
      id: number;
      name: string | null;
    };
  } | null;
  reactions: ChatReaction[];
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
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUserId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("userId"))
      : null;

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        replyToMessageId: replyToMessage?.id ?? null,
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
    setReplyToMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReaction = async (messageId: number, emoji: string) => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/chat/reactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        messageId,
        emoji,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    fetchMessages();
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>読み込み中...</div>;
  }

  if (!room) {
    return <div style={{ padding: "20px" }}>チャットルームがありません</div>;
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1000px",
        padding: "20px",
        margin: "0 auto",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <button onClick={() => router.push("/chat")}>
        チャットルーム一覧へ戻る
      </button>

      <h1 style={{ marginTop: "20px" }}>{room.roomName}</h1>
      <p style={{ color: "#555" }}>{room.description || "説明なし"}</p>

      <hr />

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "16px",
          padding: "16px",
          minHeight: "420px",
          maxHeight: "520px",
          overflowY: "auto",
          background: "#ffffff",
        }}
      >
        {messages.length === 0 ? (
          <p style={{ color: "#777" }}>まだメッセージはありません</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.user.id === currentUserId;

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isMine ? "flex-end" : "flex-start",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    backgroundColor: isMine ? "#dbeafe" : "#f1f5f9",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      marginBottom: "4px",
                      color: "#334155",
                    }}
                  >
                    {isMine ? "自分" : msg.user.name ?? "名無しユーザー"}
                  </div>

                  {msg.replyToMessage && (
                    <div
                      style={{
                        backgroundColor: "#e2e8f0",
                        borderLeft: "4px solid #2563eb",
                        padding: "8px",
                        borderRadius: "8px",
                        marginBottom: "8px",
                        fontSize: "13px",
                        color: "#475569",
                      }}
                    >
                      <strong>
                        {msg.replyToMessage.user.name ?? "名無しユーザー"}への返信
                      </strong>
                      <div>{msg.replyToMessage.messageText}</div>
                    </div>
                  )}

                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                    }}
                  >
                    {msg.messageText}
                  </div>

                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "11px",
                      color: "#64748b",
                      textAlign: "right",
                    }}
                  >
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      marginTop: "8px",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <button onClick={() => setReplyToMessage(msg)}>
                      返信
                    </button>

                    {["👍", "❤️", "👏"].map((emoji) => {
                      const count = msg.reactions.filter(
                        (reaction) => reaction.emoji === emoji
                      ).length;

                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg.id, emoji)}
                        >
                          {emoji} {count > 0 ? count : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {replyToMessage && (
        <div
          style={{
            marginTop: "16px",
            padding: "10px 12px",
            borderRadius: "12px",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e40af",
          }}
        >
          <strong>
            {replyToMessage.user.name ?? "名無しユーザー"}に返信中
          </strong>
          <p style={{ margin: "6px 0" }}>{replyToMessage.messageText}</p>
          <button onClick={() => setReplyToMessage(null)}>
            返信をキャンセル
          </button>
        </div>
      )}

      <div style={{ marginTop: "16px" }}>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力してください。Enterで送信、Shift+Enterで改行できます。"
          style={{
            width: "100%",
            height: "100px",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #ccc",
            resize: "vertical",
          }}
        />
      </div>

      <div style={{ marginTop: "12px", textAlign: "right" }}>
        <button
          onClick={handleSend}
          disabled={sending}
          style={{
            padding: "8px 20px",
            borderRadius: "999px",
            border: "1px solid #2563eb",
            backgroundColor: sending ? "#bfdbfe" : "#2563eb",
            color: "white",
            cursor: sending ? "not-allowed" : "pointer",
          }}
        >
          {sending ? "送信中..." : "送信する"}
        </button>
      </div>
    </div>
  );
}