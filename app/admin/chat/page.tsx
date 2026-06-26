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

export default function AdminChatPage() {
  const router = useRouter();

  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
        const adminUserId = localStorage.getItem("userId");

        if (!adminUserId) {
          router.push("/login");
          return;
        }

        const res = await fetch(
          `/api/admin/chat/rooms?adminUserId=${adminUserId}`
        );

        const data = await res.json();

        if (!res.ok) {
          alert(data.message);
          router.push("/admin");
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

  const handleCreateRoom = async () => {
    const adminUserId = localStorage.getItem("userId");

    const res = await fetch("/api/admin/chat/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminUserId,
        roomName,
        description,
      }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      setRoomName("");
      setDescription("");
      fetchRooms();
    }
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>読み込み中...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>チャットルーム管理</h1>

      <button onClick={() => router.push("/admin")}>
        管理者トップへ戻る
      </button>

      <hr />

      <h2>チャットルーム作成</h2>

      <div style={{ marginBottom: "12px" }}>
        <label>ルーム名</label>
        <br />
        <input
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="例：OC参加者チャット"
          style={{ width: "400px", padding: "8px" }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label>説明</label>
        <br />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例：オープンキャンパス参加者同士で感想を共有するチャット"
          style={{ width: "400px", height: "100px", padding: "8px" }}
        />
      </div>

      <button onClick={handleCreateRoom}>作成</button>

      <hr />

      <h2>作成済みチャットルーム</h2>

      {rooms.length === 0 ? (
        <p>まだチャットルームはありません</p>
      ) : (
        rooms.map((room) => (
          <div
            key={room.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "12px",
            }}
          >
            <h3>{room.roomName}</h3>
            <p>{room.description || "説明なし"}</p>
            <p>作成日：{new Date(room.createdAt).toLocaleString()}</p>
            <p>メッセージ数：{room.messages.length}</p>
          </div>
        ))
      )}
    </div>
  );
}