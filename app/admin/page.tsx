"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
      return;
    }

    const checkAdmin = async () => {
      const res = await fetch(`/api/admin/check?userId=${userId}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        router.push("/dashboard");
        return;
      }

      setAdminName(data.user.name);
    };

    checkAdmin();
  }, [router]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>管理者トップ画面</h1>
      <p>{adminName} さん、管理者としてログイン中</p>

      <ul>
        <li>
          <button onClick={() => router.push("/admin/spots")}>
            QR発行画面
          </button>
        </li>
        <li>
          <button onClick={() => router.push("/admin/users")}>
            ユーザー管理
          </button>
        </li>
        <li>スポット分析画面（未実装）</li>
        <li>
          <button onClick={() => router.push("/admin/proposals")}>
            提案管理
          </button>
        </li>
        <li>
          <button onClick={() => router.push("/admin/chat")}>
            チャット管理
          </button>
        </li>
      </ul>
    </div>
  );
}