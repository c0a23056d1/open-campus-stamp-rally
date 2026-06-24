"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
    id: number;
    name: string;
    email: string;
    isAdmin: boolean;
    createdAt: string;
    wallet: {
        symbolAddress: string;
    } |null;
    nft: {
        nftId: string;
        level: number;
        title: string | null;
        stampCount: number
        mosaicId: string | null;
        issueTxHash: string | null;
        issueAt: string | null;
        metadataTxHash: string | null;
        metadataUpdatedAt: string | null;
        imageUrl: string | null;
    } | null;
    stampLogs: {
        id: number;
        visitedAt: string;
        spot: {
            spotName: string;
            floor: string;
        };
    }[];
};


export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        const adminUserId = localStorage.getItem("userId");

        if (!adminUserId) {
            router.push("/login");
            return;
        }
        const res = await fetch(`/api/admin/users?adminUserId=${adminUserId}`);
        const data = await res.json();

        if (!res.ok) {
            alert(data.message);
            router.push("/login");
            return;
        }
        setUsers(data.users);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);
    if (loading) {
        return <div style={{ padding: "20px" }}>読み込み中</div>;
    }

    return (
        <div style={{ padding: "20px" }}>
            <h1>ユーザー管理</h1>

            <button onClick={() => router.push("/admin")}>
                管理者トップへ戻る
            </button>

            <hr />

            <p>登録ユーザー数: {users.length}</p>

            {users.map((user) => (
                <div
                    key={user.id}
                    style={{
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: "16px",
                    }}
                >
                    <h2>
                        {user.name} {user.isAdmin ? "(管理者)" : ""}
                    </h2>

                    <p>ユーザーID: {user.id}</p>
                    <p>メールアドレス: {user.email}</p>
                    <p>登録日: {new Date(user.createdAt).toLocaleString()}</p>

                    <h3>ウォレット情報</h3>
                    <p>
                        Symbolアドレス：
                        {user.wallet?.symbolAddress || "未登録"}
                    </p>

                    <h3>NFT情報</h3>
                    {user.nft ? (
                        <>
                            <p>NFT ID: {user.nft.nftId}</p>
                            <p>レベル: {user.nft.level}</p>
                            <p>タイトル: {user.nft.title || "未登録"}</p>
                            <p>スタンプ数: {user.nft.stampCount}</p>
                            <p>Mosaic ID: {user.nft.mosaicId || "未登録"}</p>
                            <p>
                                初期NFT TxHash:
                                {user.nft.issueTxHash || "未登録"}
                            </p>
                            <p>
                                Metadata TxHash:
                                {user.nft.metadataTxHash || "未登録"}
                            </p>
                            <p>
                                Metadata更新日:
                                {user.nft.metadataUpdatedAt
                                    ? new Date(user.nft.metadataUpdatedAt).toLocaleString()
                                    : "未登録"}
                            </p>
                        </>
                    ) : (
                        <p>NFT情報がありません</p>
                    )}

                    <h3>取得スタンプ</h3>
                    {user.stampLogs.length === 0 ? (
                        <p>未取得</p>
                    ) : (
                        <ul>
                            {user.stampLogs.map((log) => (
                                <li key={log.id}>
                                    {log.spot.floor}：{log.spot.spotName} (
                                    {new Date(log.visitedAt).toLocaleString()})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}