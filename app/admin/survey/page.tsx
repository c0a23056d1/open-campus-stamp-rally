"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

const questions = [
  "今回のオープンキャンパスに参加して大学への興味が高まった",
  "次回もオープンキャンパスに参加したいと思う",
  "自分がどの学科や研究室に興味を持ったか振り返りやすかった",
  "マップ画像によって活動履歴を把握しやすくなった",
  "マップ表示によって訪問した場所を振り返りやすかった",
  "保存した研究室評価は後から振り返る際に役立つと感じた",
  "他の参加者との交流機会があった",
  "同じ興味を持つ参加者と話す機会があった",
  "参加者同士のつながりを感じた",
  "レベルアップが参加のモチベーションに繋がった",
  "チャット機能は交流に役立った",
  "投票結果に興味を持った",
  "このアプリは大学選びの参考になると感じた",
  "イベント運営に自分の意見を反映できると感じた",
  "自分もイベントづくりに参加している感覚があった",
  "総合的に満足できた",
  "dNFTとして活動履歴が残ることに価値を感じた",
  "自分の参加状況に応じて機能が解放される仕組みは分かりやすかった",
  "オープンキャンパス終了後もチャットや投票を利用したいと思う",
];

type QuestionStat = {
  questionNumber: number;
  average: number;
  distribution: {
    score: number;
    count: number;
  }[];
};

type SurveyResponse = {
  id: number;
  goodPoint: string | null;
  improvePoint: string | null;
  futureRequest: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
};

type InterestTagAnalysis = {
  responseId: number;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  dnftTags: string[];
  surveyTags: string[];
  matchedTags: string[];
  matchCount: number;
  matchRate: number;
  hasDnftTags: boolean;
  hasThreeSurveyTags: boolean;
};

type MatchCountDistribution = {
  matchCount: number;
  matchRate: number;
  userCount: number;
};

type SurveyData = {
  totalResponses: number;
  questionStats: QuestionStat[];
  responses: SurveyResponse[];
  interestTagAnalysis: InterestTagAnalysis[];
  averageInterestMatchRate: number;
  analyzedUserCount: number;
  matchCountDistribution: MatchCountDistribution[];
};

function getMatchRateStyle(matchRate: number): CSSProperties {
  if (matchRate >= 100) {
    return {
      color: "#047857",
      backgroundColor: "#d1fae5",
      border: "1px solid #6ee7b7",
    };
  }

  if (matchRate >= 66.7) {
    return {
      color: "#3f6212",
      backgroundColor: "#ecfccb",
      border: "1px solid #bef264",
    };
  }

  if (matchRate >= 33.3) {
    return {
      color: "#c2410c",
      backgroundColor: "#ffedd5",
      border: "1px solid #fdba74",
    };
  }

  return {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    border: "1px solid #fca5a5",
  };
}

function formatTagList(tags: string[], emptyText: string) {
  return tags.length > 0 ? tags.join(" / ") : emptyText;
}

export default function AdminSurveyPage() {
  const router = useRouter();

  const [data, setData] = useState<SurveyData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const adminUserId = localStorage.getItem("userId");

        if (!adminUserId) {
          router.push("/login");
          return;
        }

        const res = await fetch(
          `/api/admin/survey?adminUserId=${adminUserId}`
        );

        const json = await res.json();

        if (!res.ok) {
          const message =
            typeof json.message === "string"
              ? json.message
              : "アンケート分析データの取得に失敗しました";

          setErrorMessage(message);
          alert(message);
          router.push("/admin");
          return;
        }

        setData({
          totalResponses: json.totalResponses ?? 0,
          questionStats: json.questionStats ?? [],
          responses: json.responses ?? [],
          interestTagAnalysis: json.interestTagAnalysis ?? [],
          averageInterestMatchRate:
            json.averageInterestMatchRate ?? 0,
          analyzedUserCount: json.analyzedUserCount ?? 0,
          matchCountDistribution:
            json.matchCountDistribution ?? [],
        });
      } catch (error) {
        console.error(error);
        setErrorMessage(
          "アンケート分析データの取得中にエラーが発生しました"
        );
      }
    };

    fetchSurvey();
  }, [router]);

  if (errorMessage) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <section style={styles.card}>
            <h1 style={styles.pageTitle}>エラー</h1>
            <p style={styles.errorText}>{errorMessage}</p>

            <button
              onClick={() => router.push("/admin")}
              style={styles.outlineButton}
            >
              管理者トップへ戻る
            </button>
          </section>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "24px" }}>
        アンケート分析データを読み込んでいます...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.headerCard}>
          <div>
            <p style={styles.kicker}>Survey Analytics</p>

            <h1 style={styles.pageTitle}>
              アンケート分析
            </h1>

            <p style={styles.subtitle}>
              回答数、設問別平均、5段階評価の分布、興味タグ一致率、
              自由記述を確認できます。
            </p>
          </div>

          <button
            onClick={() => router.push("/admin")}
            style={styles.outlineButton}
          >
            管理者トップへ戻る
          </button>
        </header>

        <div style={styles.summaryGrid}>
          <section style={styles.summaryCard}>
            <p style={styles.summaryLabel}>
              アンケート回答数
            </p>

            <strong style={styles.summaryNumber}>
              {data.totalResponses}
            </strong>

            <span style={styles.summaryUnit}>人</span>
          </section>

          <section style={styles.summaryCard}>
            <p style={styles.summaryLabel}>
              興味タグ分析対象者
            </p>

            <strong style={styles.summaryNumber}>
              {data.analyzedUserCount}
            </strong>

            <span style={styles.summaryUnit}>人</span>
          </section>

          <section style={styles.summaryCard}>
            <p style={styles.summaryLabel}>
              興味タグ平均一致率
            </p>

            <strong style={styles.summaryNumber}>
              {data.averageInterestMatchRate}
            </strong>

            <span style={styles.summaryUnit}>%</span>
          </section>
        </div>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            興味タグ一致率
          </h2>

          <p style={styles.descriptionText}>
            dNFTに記録された興味タグ上位3件と、
            アンケートで回答された興味分野3件を比較しています。
            一致数を3で割り、百分率として表示します。
          </p>

          <div style={styles.rateGuide}>
            <span
              style={{
                ...styles.guideBadge,
                ...getMatchRateStyle(100),
              }}
            >
              3件一致：100%
            </span>

            <span
              style={{
                ...styles.guideBadge,
                ...getMatchRateStyle(66.7),
              }}
            >
              2件一致：66.7%
            </span>

            <span
              style={{
                ...styles.guideBadge,
                ...getMatchRateStyle(33.3),
              }}
            >
              1件一致：33.3%
            </span>

            <span
              style={{
                ...styles.guideBadge,
                ...getMatchRateStyle(0),
              }}
            >
              0件一致：0%
            </span>
          </div>

          {data.interestTagAnalysis.length === 0 ? (
            <p style={styles.emptyText}>
              興味分野の回答はまだありません。
            </p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableHeader}>
                      ユーザー
                    </th>

                    <th style={styles.tableHeader}>
                      dNFT興味タグ
                    </th>

                    <th style={styles.tableHeader}>
                      アンケート回答
                    </th>

                    <th style={styles.tableHeader}>
                      一致したタグ
                    </th>

                    <th style={styles.tableHeader}>
                      一致数
                    </th>

                    <th style={styles.tableHeader}>
                      一致率
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.interestTagAnalysis.map((item) => {
                    const isAnalysisAvailable =
                      item.hasDnftTags &&
                      item.hasThreeSurveyTags;

                    return (
                      <tr key={item.responseId}>
                        <td style={styles.tableCell}>
                          <strong>
                            {item.user.name ??
                              item.user.email}
                          </strong>

                          {item.user.name && (
                            <p style={styles.userEmail}>
                              {item.user.email}
                            </p>
                          )}
                        </td>

                        <td style={styles.tableCell}>
                          {formatTagList(
                            item.dnftTags,
                            "dNFTタグ未生成"
                          )}
                        </td>

                        <td style={styles.tableCell}>
                          {formatTagList(
                            item.surveyTags,
                            "未回答"
                          )}
                        </td>

                        <td style={styles.tableCell}>
                          {formatTagList(
                            item.matchedTags,
                            "一致なし"
                          )}
                        </td>

                        <td style={styles.tableCell}>
                          {isAnalysisAvailable
                            ? `${item.matchCount} / 3`
                            : "分析対象外"}
                        </td>

                        <td style={styles.tableCell}>
                          {isAnalysisAvailable ? (
                            <span
                              style={{
                                ...styles.matchRateBadge,
                                ...getMatchRateStyle(
                                  item.matchRate
                                ),
                              }}
                            >
                              {item.matchRate}%
                            </span>
                          ) : (
                            <span
                              style={
                                styles.unavailableBadge
                              }
                            >
                              算出不可
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            一致件数別の人数
          </h2>

          {data.matchCountDistribution.length === 0 ? (
            <p style={styles.emptyText}>
              分析可能な回答がありません。
            </p>
          ) : (
            <div style={styles.distributionGrid}>
              {data.matchCountDistribution.map(
                (item) => (
                  <div
                    key={item.matchCount}
                    style={{
                      ...styles.distributionCard,
                      ...getMatchRateStyle(
                        item.matchRate
                      ),
                    }}
                  >
                    <p style={styles.distributionLabel}>
                      {item.matchCount} / 3 一致
                    </p>

                    <strong
                      style={styles.distributionNumber}
                    >
                      {item.userCount}
                    </strong>

                    <span>人</span>

                    <p style={styles.distributionRate}>
                      一致率 {item.matchRate}%
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            設問別評価
          </h2>

          {data.questionStats.length === 0 ? (
            <p style={styles.emptyText}>
              回答データがありません。
            </p>
          ) : (
            data.questionStats.map((stat) => {
              const question =
                questions[
                  stat.questionNumber - 1
                ] ??
                `設問${stat.questionNumber}`;

              const maxCount = Math.max(
                1,
                ...stat.distribution.map(
                  (item) => item.count
                )
              );

              return (
                <div
                  key={stat.questionNumber}
                  style={styles.questionCard}
                >
                  <h3 style={styles.questionTitle}>
                    Q{stat.questionNumber}.{" "}
                    {question}
                  </h3>

                  <p style={styles.averageText}>
                    平均：
                    <strong>{stat.average}</strong> / 5
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    {stat.distribution.map(
                      (item) => {
                        const percent =
                          Math.round(
                            (item.count /
                              maxCount) *
                              100
                          );

                        return (
                          <div key={item.score}>
                            <div
                              style={
                                styles.barHeader
                              }
                            >
                              <span>
                                {item.score}点
                              </span>

                              <span>
                                {item.count}人
                              </span>
                            </div>

                            <div
                              style={styles.barBase}
                            >
                              <div
                                style={{
                                  ...styles.bar,
                                  width: `${percent}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            自由記述
          </h2>

          <h3>良かった点</h3>

          {data.responses.filter(
            (response) => response.goodPoint
          ).length === 0 ? (
            <p style={styles.emptyText}>
              まだ回答はありません。
            </p>
          ) : (
            data.responses
              .filter(
                (response) =>
                  response.goodPoint
              )
              .map((response) => (
                <CommentCard
                  key={`good-${response.id}`}
                  user={
                    response.user.name ??
                    response.user.email
                  }
                  text={response.goodPoint!}
                  createdAt={
                    response.createdAt
                  }
                />
              ))
          )}

          <h3 style={{ marginTop: "24px" }}>
            改善してほしい点
          </h3>

          {data.responses.filter(
            (response) =>
              response.improvePoint
          ).length === 0 ? (
            <p style={styles.emptyText}>
              まだ回答はありません。
            </p>
          ) : (
            data.responses
              .filter(
                (response) =>
                  response.improvePoint
              )
              .map((response) => (
                <CommentCard
                  key={`improve-${response.id}`}
                  user={
                    response.user.name ??
                    response.user.email
                  }
                  text={
                    response.improvePoint!
                  }
                  createdAt={
                    response.createdAt
                  }
                />
              ))
          )}

          <h3 style={{ marginTop: "24px" }}>
            今後追加してほしい機能・投票テーマ
          </h3>

          {data.responses.filter(
            (response) =>
              response.futureRequest
          ).length === 0 ? (
            <p style={styles.emptyText}>
              まだ回答はありません。
            </p>
          ) : (
            data.responses
              .filter(
                (response) =>
                  response.futureRequest
              )
              .map((response) => (
                <CommentCard
                  key={`future-${response.id}`}
                  user={
                    response.user.name ??
                    response.user.email
                  }
                  text={
                    response.futureRequest!
                  }
                  createdAt={
                    response.createdAt
                  }
                />
              ))
          )}
        </section>
      </div>
    </div>
  );
}

function CommentCard({
  user,
  text,
  createdAt,
}: {
  user: string;
  text: string;
  createdAt: string;
}) {
  return (
    <div style={styles.commentCard}>
      <p style={styles.commentText}>
        {text}
      </p>

      <p style={styles.commentMeta}>
        {user} /{" "}
        {new Date(
          createdAt
        ).toLocaleString()}
      </p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    padding: "32px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1180px",
    margin: "0 auto",
  },

  headerCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow:
      "0 8px 24px rgba(0,0,0,0.05)",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  kicker: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: "14px",
    margin: "0 0 8px",
  },

  pageTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "30px",
  },

  subtitle: {
    margin: "10px 0 0",
    color: "#64748b",
    lineHeight: 1.6,
  },

  outlineButton: {
    padding: "10px 18px",
    borderRadius: "999px",
    border: "1px solid #2563eb",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    fontWeight: "bold",
    cursor: "pointer",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },

  summaryCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow:
      "0 8px 24px rgba(0,0,0,0.05)",
  },

  summaryLabel: {
    margin: 0,
    color: "#64748b",
    fontWeight: "bold",
  },

  summaryNumber: {
    display: "inline-block",
    marginTop: "8px",
    marginRight: "6px",
    fontSize: "36px",
    color: "#2563eb",
  },

  summaryUnit: {
    color: "#64748b",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow:
      "0 8px 24px rgba(0,0,0,0.05)",
  },

  sectionTitle: {
    marginTop: 0,
    color: "#0f172a",
  },

  descriptionText: {
    color: "#64748b",
    lineHeight: 1.7,
  },

  rateGuide: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    margin: "16px 0 22px",
  },

  guideBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "bold",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "950px",
    borderCollapse: "collapse",
  },

  tableHeaderRow: {
    backgroundColor: "#f8fafc",
  },

  tableHeader: {
    padding: "12px",
    borderBottom:
      "2px solid #e5e7eb",
    color: "#334155",
    fontSize: "14px",
    textAlign: "left",
    whiteSpace: "nowrap",
  },

  tableCell: {
    padding: "14px 12px",
    borderBottom:
      "1px solid #e5e7eb",
    color: "#334155",
    lineHeight: 1.6,
    verticalAlign: "top",
  },

  userEmail: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  matchRateBadge: {
    display: "inline-block",
    minWidth: "72px",
    padding: "6px 10px",
    borderRadius: "999px",
    textAlign: "center",
    fontWeight: "bold",
  },

  unavailableBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    fontWeight: "bold",
  },

  distributionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },

  distributionCard: {
    borderRadius: "16px",
    padding: "18px",
    textAlign: "center",
  },

  distributionLabel: {
    margin: "0 0 8px",
    fontWeight: "bold",
  },

  distributionNumber: {
    fontSize: "32px",
    marginRight: "4px",
  },

  distributionRate: {
    margin: "8px 0 0",
    fontWeight: "bold",
    fontSize: "14px",
  },

  questionCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "14px",
    backgroundColor: "#f8fafc",
  },

  questionTitle: {
    margin: "0 0 8px",
    color: "#0f172a",
    lineHeight: 1.6,
  },

  averageText: {
    color: "#2563eb",
    fontWeight: "bold",
  },

  barHeader: {
    display: "flex",
    justifyContent: "space-between",
    color: "#475569",
    fontSize: "14px",
    marginBottom: "4px",
  },

  barBase: {
    height: "9px",
    borderRadius: "999px",
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },

  bar: {
    height: "9px",
    borderRadius: "999px",
    backgroundColor: "#2563eb",
  },

  commentCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "10px",
    backgroundColor: "#f8fafc",
  },

  commentText: {
    margin: 0,
    color: "#334155",
    whiteSpace: "pre-wrap",
    lineHeight: 1.7,
  },

  commentMeta: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  emptyText: {
    color: "#64748b",
  },

  errorText: {
    color: "#b91c1c",
    lineHeight: 1.7,
  },
};