"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ChatRoom = {
  id: number;
  roomName: string;
  description: string | null;
  createdAt: string;
  messages: {
    id: number;
  }[];
};

export default function ChatRoomsPage() {
  const router = useRouter();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/chat/rooms?userId=${userId}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        router.push("/dashboard");
        return;
      }

      setRooms(data.rooms);
    } catch (error) {
      console.error("チャットルーム取得エラー:", error);
      alert("チャットルーム取得中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f8fafc" }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "32px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
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
              Community Chat
            </p>

            <h1 style={{ margin: 0, color: "#0f172a", fontSize: "30px" }}>
              チャットルーム
            </h1>

            <p style={{ margin: "10px 0 0", color: "#64748b" }}>
              参加者同士で感想やProposalについて話し合えます。
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "10px 18px",
              borderRadius: "999px",
              border: "1px solid #2563eb",
              backgroundColor: "#ffffff",
              color: "#2563eb",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ダッシュボードへ戻る
          </button>
        </header>

        {rooms.length === 0 ? (
          <section
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "20px",
              padding: "32px",
              textAlign: "center",
              color: "#64748b",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ color: "#0f172a" }}>利用できるチャットルームはまだありません</h2>
            <p>管理者がチャットルームを作成すると、ここに表示されます。</p>
          </section>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {rooms.map((room) => {
              const isProposalRoom = room.roomName.includes("議論");

              return (
                <div
                  key={room.id}
                  onClick={() => router.push(`/chat/${room.id}`)}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "20px",
                    padding: "22px",
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                    transition: "0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      backgroundColor: isProposalRoom ? "#f5f3ff" : "#eff6ff",
                      color: isProposalRoom ? "#7c3aed" : "#2563eb",
                      fontSize: "13px",
                      fontWeight: "bold",
                      marginBottom: "14px",
                    }}
                  >
                    {isProposalRoom ? "Proposal議論" : "通常チャット"}
                  </div>

                  <h2
                    style={{
                      margin: "0 0 10px",
                      color: "#0f172a",
                      fontSize: "21px",
                    }}
                  >
                    {room.roomName}
                  </h2>

                  <p
                    style={{
                      color: "#64748b",
                      lineHeight: 1.6,
                      minHeight: "48px",
                      marginBottom: "18px",
                    }}
                  >
                    {room.description || "説明なし"}
                  </p>

                  <div
                    style={{
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: "#475569",
                      fontSize: "14px",
                    }}
                  >
                    <span>メッセージ数：{room.messages.length}</span>
                    <span style={{ color: "#2563eb", fontWeight: "bold" }}>
                      入室する →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}