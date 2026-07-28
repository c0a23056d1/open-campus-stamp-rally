"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildDnftMetadata } from "@/lib/dnftMetadata";

type PassportData = {
  user: {
    id: number;
    name: string;
    email: string;
  };
  wallet: {
    symbolAddress: string;
  } | null;
  nft: {
    level: number;
    title: string | null;
    stampCount: number;
    nftId: string;
    imageUrl: string | null;
  } | null;
  stamps: {
    id: number;
    spotId: number;
    visitedAt: string;
    spotName: string;
    floor: string;
  }[];
  spots: {
    spotName: string;
    floor: string;
  }[];
  spotRatings: {
    id: number;
    spotId: number;
    rating: number;
    comment: string | null;
  }[];
};


export default function DashboardPage() {
  const [passport, setPassport] = useState<PassportData | null>(null);
  const router = useRouter();

  const searchParams = useSearchParams();
  const isNewStamp = searchParams.get("newStamp") === "1";
  const spotId = Number(searchParams.get("spotId"));

  const spotName = searchParams.get("spotName") ?? "";
  
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [showGuide, setShowGuide] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState("");

  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    const fetchPassport = async () => {
      try {
        const res = await fetch("/api/passport", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = (await res.json()) as
          | PassportData
          | { message?: string };

        if (!res.ok) {
          const message =
            "message" in data
              ? data.message
              : "Passport情報を取得できませんでした";

          console.error(message);

          router.replace("/start");
          return;
        }

        setPassport(data as PassportData);
      } catch (error) {
        console.error(
          "Passport情報の取得に失敗しました:",
          error
        );

        router.replace("/start");
      }
    };

    void fetchPassport();
  }, [router]);

  useEffect(() => {
    if (isNewStamp) {
      setShowCommentModal(true);
    }
  }, [isNewStamp]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const data = (await res.json()) as {
        message?: string;
      };

      if (!res.ok) {
        throw new Error(
          data.message || "ログアウトに失敗しました"
        );
      }

      router.replace("/start");
      router.refresh();
    } catch (error) {
      console.error(
        "ログアウトに失敗しました:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "ログアウトに失敗しました"
      );
    }
  };
  const handleRating = async (
    spotId: number,
    rating: number
  ) => {
    try {
      const res = await fetch("/api/spot-ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        // Session Cookieを送信
        credentials: "include",

        body: JSON.stringify({
          spotId,
          rating,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        alert(
          data.message ??
            "認証の有効期限が切れました。"
        );

        router.replace("/start");
        return;
      }

      if (!res.ok) {
        alert(data.message);
        return;
      }

      setRatings((prev) => ({
        ...prev,
        [spotId]: rating,
      }));

      alert("評価を保存しました！");
    } catch (error) {
      console.error(
        "研究室評価の保存に失敗しました:",
        error
      );

      alert("研究室評価の保存に失敗しました。");
    }
  };
  if (!passport) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f8fafc" }}>
        読み込み中...
      </div>
    );
  }

  const handleCommentSubmit = async () => {
    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      alert("感想を入力してください");
      return;
    }

    if (!spotId || !Number.isInteger(spotId)) {
      alert("研究室情報を取得できませんでした");
      return;
    }

    if (trimmedComment.length > 300) {
      alert("感想は300文字以内で入力してください");
      return;
    }

    try {
      setSendingComment(true);

      /*
      * 訪問可能なチャットルーム一覧を取得する
      */
      const roomsRes = await fetch("/api/chat/rooms", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const roomsData = await roomsRes.json();

      if (roomsRes.status === 401) {
        alert(
          roomsData.message ??
            "認証の有効期限が切れました。もう一度認証してください。"
        );

        router.replace("/start");
        return;
      }

      if (!roomsRes.ok) {
        throw new Error(
          roomsData.message ??
            "チャットルームの取得に失敗しました"
        );
      }

      /*
      * 今回スタンプを取得した研究室に対応する
      * spot型チャットルームを検索する
      */
      const targetRoom = roomsData.rooms.find(
        (room: {
          id: number;
          roomType: string;
          spotId: number | null;
          spot?: {
            id: number;
          } | null;
        }) =>
          room.roomType === "spot" &&
          (room.spotId === spotId ||
            room.spot?.id === spotId)
      );

      if (!targetRoom) {
        throw new Error(
          "この研究室に対応するチャットルームが見つかりません"
        );
      }

      /*
      * 既存のチャット投稿APIへ感想を送信する
      */
      const messageRes = await fetch("/api/chat/messages", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: targetRoom.id,
          messageText: trimmedComment,
          replyToMessageId: null,
        }),
      });

      const messageData = await messageRes.json();

      if (messageRes.status === 401) {
        alert(
          messageData.message ??
            "認証の有効期限が切れました。もう一度認証してください。"
        );

        router.replace("/start");
        return;
      }

      if (!messageRes.ok) {
        throw new Error(
          messageData.message ??
            "感想の投稿に失敗しました"
        );
      }

      alert("感想を投稿しました！");

      setComment("");
      setShowCommentModal(false);

      /*
      * 投稿後に研究室チャットへ移動する場合
      */
      router.replace(`/chat/${targetRoom.id}`);
    } catch (error) {
      console.error("感想投稿エラー:", error);

      alert(
        error instanceof Error
          ? error.message
          : "感想の投稿に失敗しました"
      );
    } finally {
      setSendingComment(false);
    }
  };

  const visitedSpots = passport.stamps.map((stamp) => stamp.spotName);

  const dnftMetadata = passport.nft
    ? buildDnftMetadata({
        nftId: passport.nft.nftId,
        level: passport.nft.level,
        title: passport.nft.title ?? "Fresh Visitor",
        stampCount: passport.nft.stampCount,
        visitedSpots,
        interestTags: [], // Assuming interestTags is not available in the current context
        favoriteLabs: [], // Assuming favoriteLabs is not available in the current context
        imageUrl: passport.nft.imageUrl ?? undefined,
      })
    : null;

  const stampCount = passport.nft?.stampCount ?? 0;
  const totalSpotCount = passport.spots.length;
  const dnftImageUrl = passport.nft?.imageUrl
    ? passport.nft.imageUrl.replace(
        "ipfs://",
        "https://gateway.pinata.cloud/ipfs/"
      )
    : null;

  const passportDesign =
    stampCount >= 7
      ? {
          level: 4,
          label: "Level 4",
          title: "Campus Ambassador",
          borderColor: "#ec4899",
          backgroundColor: "#fdf2f8",
          badgeColor: "#db2777",
          description: "最大レベルです。DAO提案・投票・チャットを活用できます。",
        }
      : stampCount >= 5
      ? {
          level: 3,
          label: "Level 3",
          title: "Campus Member",
          borderColor: "#f59e0b",
          backgroundColor: "#fffbeb",
          badgeColor: "#d97706",
          description: "DAO投票の提案が可能になります。",
        }
      : stampCount >= 3
      ? {
          level: 2,
          label: "Level 2",
          title: "Research Supporter",
          borderColor: "#8b5cf6",
          backgroundColor: "#f5f3ff",
          badgeColor: "#7c3aed",
          description: "DAO投票機能が解放されます。",
        }
      : stampCount >= 1
      ? {
          level: 1,
          label: "Level 1",
          title: "Explorer",
          borderColor: "#3b82f6",
          backgroundColor: "#eff6ff",
          badgeColor: "#2563eb",
          description: "チャット機能が解放されます。",
        }
      : {
          level: 0,
          label: "Level 0",
          title: "Fresh Visitor",
          borderColor: "#d1d5db",
          backgroundColor: "#f9fafb",
          badgeColor: "#6b7280",
          description: "まずは研究室を訪問してスタンプを集めましょう。",
        };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        // padding: "32px",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
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
              Open Campus Passport
            </p>
            <h1 style={{ margin: 0, color: "#0f172a", fontSize: "30px" }}>
              ダッシュボード
            </h1>
            <p style={{ margin: "10px 0 0", color: "#64748b" }}>
              {passport.user.name} さんのOC Passport情報です。
            </p>
          </div>

          <div 
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button 
              onClick={() => setShowGuide(true)}
              style={{
                padding: "10px 18px",
                borderRadius: "999px",
                border: "1px solid #2563eb",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              使い方
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 18px",
                borderRadius: "999px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#334155",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ログアウト
            </button>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "18px",
            alignItems: "start",
          }}
        >
        <section
          style={{
            border: `4px solid ${passportDesign.borderColor}`,
            backgroundColor: passportDesign.backgroundColor,
            borderRadius: "24px",
            padding: "18px",
            boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
            textAlign: "center",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {dnftImageUrl ? (
            <div
              style={{
                textAlign: "center",
                margin: "0 auto",
              }}
            >
              <img
                src={dnftImageUrl}
                alt="dNFT Passport"
                style={{
                  width: "100%",
                  maxWidth: "420px",
                  height: "auto",
                  borderRadius: "16px",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                height: "420px",
                borderRadius: "16px",
                border: `2px dashed ${passportDesign.borderColor}`,
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                color: "#64748b",
                fontWeight: "bold",
              }}
            >
              OC Passport Image
            </div>
          )}
          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            <h2
              style={{
                margin: "0 0 4px",
                color: passportDesign.borderColor,
                fontSize: "24px",
              }}
            >
              {passportDesign.title}
            </h2>

            <p
              style={{
                margin: "0",
                fontSize: "16px",
                fontWeight: "bold",
                color: "#0f172a",
              }}
            >
              {passportDesign.label}
            </p>

            <div
              style={{
                margin: "18px auto 8px",
                maxWidth: "260px",
              }}
            >
              <div
                style={{
                  height: "6px",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${
                      totalSpotCount > 0
                        ? (stampCount / totalSpotCount) * 100
                        : 0
                    }%`,
                    backgroundColor: passportDesign.borderColor,
                    borderRadius: "999px",
                  }}
                />
              </div>

              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: passportDesign.borderColor,
                }}
              >
                {stampCount} / {totalSpotCount} Stamp
              </p>
            </div>

            <p style={{ margin: "12px 0 0", fontSize: "14px" }}>
              {passportDesign.description}
            </p>
          </div>
        </section>

          <main style={{ display: "grid", gap: "18px" }}>
            <section
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "22px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>アクション</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "12px",
                }}
              >
                <button style={styles.primaryButton} onClick={() => router.push("/scan")}>
                  QRスタンプ取得
                </button>
                <button style={styles.secondaryButton} onClick={() => router.push("/proposals")}>
                  投票画面
                </button>
                <button style={styles.secondaryButton} onClick={() => router.push("/chat")}>
                  チャット
                </button>
              </div>
            </section>
            <section
              style={{
                padding: "20px",
                backgroundColor: "#ecfeff",
                border: "1px solid #67e8f9",
                borderRadius: "20px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h2 style={{ marginTop: 0, fontSize: "20px" }}>
                オープンキャンパスアンケート
              </h2>
              <p
                style={{
                  color: "#475569",
                  lineHeight: 1.7,
                  marginBottom: "16px",
                }}
              >
                オープンキャンパスへの参加ありがとうございます！アプリやオープンキャンパスについてのアンケートにご協力ください。回答内容は今後のイベント改善や研究目的で利用します！
              </p>

              <button
                onClick={() => router.push("/survey")}
                style={{
                  width: "100%",
                  padding: "13px 18px",
                  borderRadius: "999px",
                  border: "none",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                アンケートに回答する
              </button>
            </section>
              

            <section
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "22px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>ユーザー情報</h2>
              <p>
                <strong>表示名：</strong>
                {passport.user.name || "名無し"}
              </p>
            </section>

            <section
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "22px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>取得スタンプ</h2>

              {passport.stamps.length === 0 ? (
                <p style={{ color: "#64748b" }}>
                  まだスタンプを取得していません。
                </p>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {passport.stamps.map((stamp) => {
                    const savedRating =
                      ratings[stamp.spotId] ??
                      passport.spotRatings.find((r) => r.spotId === stamp.spotId)?.rating ??
                      0;

                    return (
                      <div
                        key={stamp.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "14px",
                          padding: "12px 14px",
                          backgroundColor: "#f8fafc",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <span>
                            <strong>{stamp.floor}</strong>：{stamp.spotName}
                          </span>

                          <span
                            style={{
                              color: "#64748b",
                              fontSize: "13px",
                            }}
                          >
                            {new Date(stamp.visitedAt).toLocaleString()}
                          </span>
                        </div>

                        <div style={{ fontSize: "24px" }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              onClick={() => handleRating(stamp.spotId, star)}
                              style={{
                                cursor: "pointer",
                                color: star <= savedRating ? "#f59e0b" : "#d1d5db",
                                marginRight: "4px",
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {showGuide && (
        <div
          onClick={() => setShowGuide(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "85vh",
              overflowY: "auto",
              backgroundColor: "#ffffff",
              borderRadius: "22px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              boxSizing: "border-box",
            }}
          >
            <div 
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <h2 style={{ margin: 0 }}>アプリの使い方</h2>

              <button
                onClick={() => setShowGuide(false)}
                aria-label="閉じる"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gap: "14px",
                marginTop: "20px",
              }}
            >
              <GuideStep
                number="1"
                title="QRコードを読み取る"
                description="研究室に設置されたQRコードを読み取り、スタンプを取得します。"
              />

              <GuideStep
                number="2"
                title="OC Passportを育てる"
                description="取得したスタンプ数に応じてLevelや称号、Passport画像が変化します。"
              />

              <GuideStep
                number="3"
                title="研究室を評価する"
                description="訪問した研究室は、取得スタンプ一覧から5段階で評価できます。"
              />

              <GuideStep
                number="4"
                title="チャットで交流する"
                description="Level1になるとチャットが解放され、訪問した研究室の参加者と交流できます。"
              />

              <GuideStep
                number="5"
                title="投票に参加する"
                description="Level2になると投票へ参加できます。Level3になると投票テーマを提案できます。"
              />

              <GuideStep
                number="6"
                title="アンケートに回答する"
                description="体験後はぜひアンケートにアンケートに回答し、今後のオープンキャンパス改善にご協力ください！"
              />
            </div>

            <button
              onClick={() => setShowGuide(false)}
              style={{
                width: "100%",
                marginTop: "22px",
                padding: "13px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {showCommentModal && (
        <div
          onClick={() => {
            setShowCommentModal(false);
            router.replace("/dashboard");
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
            zIndex: 1000,
          }}
        >
          {/* モーダル本体 */}
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "85vh",
              overflowY: "auto",
              backgroundColor: "#ffffff",
              borderRadius: "22px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "12px",
                }}
              >
                🎉
              </div>

              <h2
                style={{
                  margin: "0 0 12px",
                  color: "#0f172a",
                }}
              >
                スタンプ獲得！
              </h2>

              <p
                style={{
                  color: "#475569",
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                <strong>{spotName}</strong>
                へ来てくださりありがとうございます！
                <br />
                印象に残ったことや感想を書いてみませんか？
              </p>
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="例）先生が優しく説明してくれた！研究内容が面白かった！"
              style={{
                width: "100%",
                minHeight: "140px",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid #cbd5e1",
                resize: "vertical",
                fontSize: "15px",
                lineHeight: 1.6,
                boxSizing: "border-box",
                marginBottom: "12px",
                outline: "none",
              }}
            />

            <p
              style={{
                margin: "0 0 20px",
                color: "#64748b",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              投稿した感想は、この研究室のチャットで他の参加者と共有されます。
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handleCommentSubmit}
                disabled={sendingComment}
                style={{
                  flex: "1 1 180px",
                  padding: "14px",
                  borderRadius: "999px",
                  border: "none",
                  backgroundColor: sendingComment
                    ? "#93c5fd"
                    : "#2563eb",
                  color: "#ffffff",
                  fontWeight: "bold",
                  fontSize: "15px",
                  cursor: sendingComment
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {sendingComment ? "送信中..." : "送信"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCommentModal(false);
                  setComment("");
                  router.replace("/dashboard");
                }}
                style={{
                  flex: "1 1 180px",
                  padding: "14px",
                  borderRadius: "999px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  fontWeight: "bold",
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                あとで書く
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GuideStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "42px 1fr",
        gap: "12px",
        alignItems: "start",
        padding: "14px",
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontWeight: "bold",
        }}
      >
        {number}
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 5px",
            fontSize: "16px",
            color: "#0f172a",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            color: "#64748b",
            lineHeight: 1.6,
            fontSize: "14px",
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
} 

const styles: { [key: string]: React.CSSProperties } = {
  primaryButton: {
    padding: "14px 18px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "14px 18px",
    borderRadius: "999px",
    border: "1px solid #2563eb",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    fontWeight: "bold",
    cursor: "pointer",
  },
};