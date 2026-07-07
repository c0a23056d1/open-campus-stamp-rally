"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";

type Spot = {
  id: number;
  spotName: string;
  floor: string;
  description: string | null;
  qrSecretCode: string;
  x: number;
  y: number;
  color: string;
  icon: string;
  interestTag: string | null;
};

const interestTagOptions = [
  "AI・機械学習",
  "ゲーム",
  "ロボット",
  "情報セキュリティ",
  "データサイエンス",
  "音声・画像処理",
  "人間・心理",
  "生体認証",
  "IoT・センシング",
  "数理・シミュレーション",
  "サービス・経営",
  "Well-being・社会",
];

export default function AdminSpotsPage() {
  const router = useRouter();

  const [spotName, setSpotName] = useState("");
  const [floor, setFloor] = useState("");
  const [description, setDescription] = useState("");

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [color, setColor] = useState("#93C5FD");
  const [icon, setIcon] = useState("📍");
  const [interestTag, setInterestTag] = useState("");

  const [spots, setSpots] = useState<Spot[]>([]);
  const [qrImages, setQrImages] = useState<Record<number, string>>({});

  const fetchSpots = async () => {
    const userId = localStorage.getItem("userId");

    const res = await fetch(`/api/admin/spots?userId=${userId}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      router.push("/dashboard");
      return;
    }

    setSpots(data.spots);

    const images: Record<number, string> = {};

    for (const spot of data.spots) {
      images[spot.id] = await QRCode.toDataURL(spot.qrSecretCode);
    }

    setQrImages(images);
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  const handleCreateSpot = async () => {
    const userId = localStorage.getItem("userId");

    const res = await fetch("/api/admin/spots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        spotName,
        floor,
        description,
        x,
        y,
        color,
        icon,
        interestTag,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert(data.message);

    setSpotName("");
    setFloor("");
    setDescription("");
    setX(0);
    setY(0);
    setColor("#93C5FD");
    setIcon("📍");
    setInterestTag("");

    fetchSpots();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>QR発行画面</h1>

      <button onClick={() => router.push("/admin")}>管理者トップへ戻る</button>

      <hr />

      <h2>スポット登録</h2>

      <div>
        <label>研究室名・スポット名</label>
        <br />
        <input
          value={spotName}
          onChange={(e) => setSpotName(e.target.value)}
          placeholder="AI研究室"
        />
      </div>

      <br />

      <div>
        <label>場所・階数</label>
        <br />
        <input
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          placeholder="6F"
        />
      </div>

      <br />

      <div>
        <label>興味タグ</label>
        <br />
        <select
          value={interestTag}
          onChange={(e) => setInterestTag(e.target.value)}
        >
          <option value="">選択してください</option>
          {interestTagOptions.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <br />

      <div>
        <label>X座標</label>
        <br />
        <input
          type="number"
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
          placeholder="70"
        />
      </div>

      <br />

      <div>
        <label>Y座標</label>
        <br />
        <input
          type="number"
          value={y}
          onChange={(e) => setY(Number(e.target.value))}
          placeholder="145"
        />
      </div>

      <br />

      <div>
        <label>スポット色</label>
        <br />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <span style={{ marginLeft: "10px" }}>{color}</span>
      </div>

      <br />

      <div>
        <label>アイコン</label>
        <br />
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="📍"
        />
      </div>

      <br />

      <div>
        <label>説明文</label>
        <br />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="研究内容の説明"
        />
      </div>

      <br />

      <button onClick={handleCreateSpot}>登録してQR発行</button>

      <hr />

      <h2>登録済みスポット一覧</h2>

      {spots.map((spot) => (
        <div
          key={spot.id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginBottom: "15px",
          }}
        >
          <h3>{spot.spotName}</h3>
          <p>場所：{spot.floor}</p>
          <p>興味タグ：{spot.interestTag ?? "未設定"}</p>
          <p>座標：x={spot.x}, y={spot.y}</p>
          <p>色：{spot.color}</p>
          <p>アイコン：{spot.icon}</p>
          <p>説明：{spot.description}</p>
          <p>QRコード内容：{spot.qrSecretCode}</p>

          {qrImages[spot.id] && (
            <img
              src={qrImages[spot.id]}
              alt={`${spot.spotName} QRコード`}
              width={160}
              height={160}
            />
          )}
        </div>
      ))}
    </div>
  );
}