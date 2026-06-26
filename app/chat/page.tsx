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
    return <div style={{ padding: "20px" }}>読み込み中...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>チャットルーム</h1>

      <button onClick={() => router.push("/dashboard")}>
        ダッシュボードへ戻る
      </button>

      <hr />

      {rooms.length === 0 ? (
        <p>利用できるチャットルームはまだありません</p>
      ) : (
        rooms.map((room) => (
          <div
            key={room.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "12px",
              cursor: "pointer",
            }}
            onClick={() => router.push(`/chat/${room.id}`)}
          >
            <h2>{room.roomName}</h2>
            <p>{room.description || "説明なし"}</p>
            <p>メッセージ数：{room.messages.length}</p>
          </div>
        ))
      )}
    </div>
  );
}