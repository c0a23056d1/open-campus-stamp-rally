"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ChatRoom = {
    id: number;
    roomName: string;
    description: string | null;
};

type AdminChatMessage = {
    id: number;
    messageText: string;
    isDeleted: boolean;
    createdAt: string;
    user: {
        id: number;
        name: string | null;
        email: string;
    };
};

export default function AdminChatMessagesPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.roomId as string;

    const [room, setRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<AdminChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = async () => {
        try {
            const adminUserId = localStorage.getItem("userId");

            if (!adminUserId) {
                router.push("/login");
                return;
            }

            const res = await fetch(
                `/api/admin/chat/messages?adminUserId=${adminUserId}&roomId=${roomId}`
            );

            const data = await res.json();

            if (!res.ok) {
                alert(data.message);
                router.push("/admin/chat");
                return;
            }

            setRoom(data.room);
            setMessages(data.messages);
        } catch (error) {
            console.error("管理者メッセージ取得エラー：", error);
            alert("メッセージ取得中にエラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleDeleteMessage = async (messageId: number) => {
        const adminUserId = localStorage.getItem("userId");

        const ok = confirm("このメッセージを削除しますか？");
        if (!ok) return;

        const res = await fetch("/api/admin/chat/messages", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                adminUserId,
                messageId,
            }),
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
            fetchMessages();
        }
    };

    if (loading) {
        return <div style={{ padding: "20px" }}>読み込み中...</div>;
    }

    if (!room) {
        return <div style={{ padding: "20px" }}>チャットルームが見つかりません</div>;
    }

    return (
        <div style={{ padding: "20px" }}>
            <h1>チャットメッセージ管理</h1>

            <button onClick={() => router.push("/admin/chat")}>
                チャットルーム管理へ戻る
            </button>

            <hr />

            <h2>{room.roomName}</h2>
            <p>{room.description || "説明なし"}</p>

            <hr />

            {messages.length === 0 ? (
                <p>メッセージはまだありません</p>
            ) : (
                messages.map((message) => (
                    <div
                        key={message.id}
                        style={{
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            padding: "16px",
                            marginBottom: "12px",
                            backgroundColor: message.isDeleted ? "#f5f5f5" : "#fff",
                            opacity: message.isDeleted ? 0.6 : 1,
                        }}
                    >
                        <p>
                            <strong>投稿者：</strong>
                            {message.user.name || "名無し"} / {message.user.email}
                        </p>

                        <p>
                            <strong>投稿日時：</strong>
                            {new Date(message.createdAt).toLocaleString()}
                        </p>

                        <p>
                            <strong>状態</strong>
                            {message.isDeleted ? "削除済み" : "有効"}
                        </p>

                        <p>
                            <strong>メッセージ内容：</strong>
                            {message.messageText}
                        </p>

                        {!message.isDeleted && (
                            <button onClick={() => handleDeleteMessage(message.id)}>
                                削除
                            </button>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}