"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

export default function ScanPage() {
  const router = useRouter();

  const qrRef = useRef<Html5Qrcode | null>(null);
  const hasStartedRef = useRef(false);
  const isStoppedRef = useRef(false);
  const isProcessingRef = useRef(false);

  const [message, setMessage] = useState("QRコードを読み取ってください");

  const stopScanner = async () => {
    if (!qrRef.current || isStoppedRef.current) return;

    try {
      await qrRef.current.stop();
      await qrRef.current.clear();
    } catch (error) {
      console.warn("scanner stop skipped:", error);
    } finally {
      qrRef.current = null;
      isStoppedRef.current = true;
    }
  };

  const sendStamp = async (qrSecretCode: string) => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      alert("ログインしてください");
      router.push("/login");
      return;
    }

    const res = await fetch("/api/stamp/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        qrSecretCode,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      router.push("/dashboard");
      return;
    }

    alert(
      `${data.message}\n取得スポット: ${data.spot.floor} ${data.spot.spotName}`
    );

    router.push("/dashboard");
  };

  useEffect(() => {
    const startScanner = async () => {
      // すでに起動済みなら何もしない
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      const readerElement = document.getElementById("qr-reader");
      if (!readerElement) return;

      // 念のため前回の描画を消す
      readerElement.innerHTML = "";

      const html5QrCode = new Html5Qrcode("qr-reader");
      qrRef.current = html5QrCode;
      isStoppedRef.current = false;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            setMessage(`読み取り成功: ${decodedText}`);

            await stopScanner();
            await sendStamp(decodedText);
          },
          () => {
            // 読み取り失敗時は何もしない
          }
        );
      } catch (error) {
        console.error(error);
        setMessage("カメラを起動できませんでした");
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>QRコード読み取り</h1>

      <p>{message}</p>

      <div
        id="qr-reader"
        style={{
          width: "300px",
          maxWidth: "100%",
          border: "1px solid #ccc",
        }}
      />

      <br />

      <button onClick={() => router.push("/dashboard")}>
        ダッシュボードへ戻る
      </button>
    </div>
  );
}