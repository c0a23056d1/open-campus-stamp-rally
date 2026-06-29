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
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      const readerElement = document.getElementById("qr-reader");
      if (!readerElement) return;

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

            setMessage("読み取りに成功しました。スタンプを登録しています...");

            await stopScanner();
            await sendStamp(decodedText);
          },
          () => {}
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              color: "#2563eb",
              fontWeight: "bold",
              fontSize: "14px",
              margin: "0 0 8px",
            }}
          >
            Stamp Scan
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              color: "#0f172a",
            }}
          >
            QRコード読み取り
          </h1>

          <p
            style={{
              marginTop: "12px",
              color: "#64748b",
              lineHeight: 1.7,
            }}
          >
            研究室や展示スポットに設置されたQRコードを読み取ると、
            OC Passportにスタンプが記録されます。
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: "999px",
              backgroundColor: "#eff6ff",
              color: "#2563eb",
              fontWeight: "bold",
              fontSize: "14px",
              marginBottom: "18px",
            }}
          >
            {message}
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "320px",
                maxWidth: "100%",
                borderRadius: "18px",
                overflow: "hidden",
                border: "2px solid #dbeafe",
                backgroundColor: "#f1f5f9",
                padding: "8px",
              }}
            >
              <div
                id="qr-reader"
                style={{
                  width: "100%",
                  minHeight: "300px",
                  borderRadius: "14px",
                  overflow: "hidden",
                }}
              />
            </div>
          </div>

          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "20px",
              lineHeight: 1.6,
            }}
          >
            カメラの使用許可を求められた場合は「許可」を選択してください。
            QRコードが読み取れない場合は、明るい場所で少し距離を調整してください。
          </p>

          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "10px 20px",
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
        </div>
      </div>
    </div>
  );
}