"use client";

import { useEffect, useState } from "react";
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
    "自分もイベントづくりに参加している感覚があった​",
    "総合的に満足できた",
]

export default function SurveyPage() {
    const router = useRouter();

    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [goodPoint, setGoodPoint] = useState("");
    const [improvePoint, setImprovePoint] = useState("");
    const [futureRequest, setFutureRequest] = useState("");
    const [loading, setLoading] = useState(false);
    const [answered, setAnswered] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAnswered = async () => {
            const userId = localStorage.getItem("userId");

            if (!userId) {
                router.push("/login");
                return;
            }

            const res = await fetch(`/api/survey?userId=${userId}`);
            const data = await res.json();

            if (res.ok && data.answered) {
                setAnswered(true);
            }

            setChecking(false);
        };

        checkAnswered();
    }, [router]);

    const handleAnswer = (questionNumber: number, value: number) => {
        setAnswers((prev) => ({
            ...prev,
            [`q${questionNumber}`]: value,
        }));
    };

    const handleSumbit = async () => {
        const userId = localStorage.getItem("userId");

        if (!userId) {
            alert("ログインしてください");
            router.push("/login");
            return;
        }

        for (let i = 1; i <= questions.length; i++) {
            if (!answers[`q${i}`]) {
                alert(`設問${i}に回答してください`);
                return;
            }
        }
        setLoading(true);

        const res = await fetch("/api/survey", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                answers,
                goodPoint,
                improvePoint,
                futureRequest,
            }),
        });

        const data = await res.json();
        alert(data.message);

        setLoading(false);
        if (res.ok) {
            setAnswered(true);
        }
    };

    if (checking) {
        return <div style={{ padding: "24px" }}>確認中...</div>;
    }

    if (answered) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <section style={styles.headerCard}>
                        <p style={styles.kicker}>Open Campus Survey</p>
                        <h1 style={styles.title}>ご回答ありがとうございました！</h1>
                        <p style={styles.subtitle}>
                            アンケートはすでに回答済みです。ご協力ありがとうございました。
                        </p>

                        <button
                            onClick={() => router.push("/dashboard")}
                            style={styles.primaryButton}
                        >
                            ダッシュボードへ戻る
                        </button>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <section style={styles.headerCard}>
                    <p style={styles.kicker}>Open Campus Survey</p>
                    <h1 style={styles.title}>アンケート</h1>
                    <p style={styles.subtitle}>
                        今回のオープンキャンパスとアプリの利用についてお聞かせください。
                        各項目について、1~5の5段階評価で回答してください。
                    </p>
                    <div style={styles.scaleBox}>
                        <span>1：全くそう思わない</span>
                        <span>2：あまりそう思わない</span>
                        <span>3：どちらともいえない</span>
                        <span>4：ややそう思う</span>
                        <span>5：とてもそう思う</span>
                    </div>
                </section>

                <section style={styles.card}>
                    {questions.map((question, index) => {
                        const questionNumber = index + 1;
                        const selectedValue = answers[`q${questionNumber}`];

                        return (
                            <div key={questionNumber} style={styles.questionBock}>
                                <p style={styles.questionText}>
                                    {questionNumber}. {question}
                                </p>
                                <div style={styles.radioRow}>
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <label
                                            key={value}
                                            style={{
                                                ...styles.radioLabel,
                                                borderColor:
                                                    selectedValue === value ? "#2563eb" : "#e5e7eb",
                                                backgroundColor:
                                                    selectedValue === value ? "#eff6ff" : "#ffffff",
                                                color: selectedValue === value ? "#2563eb" : "#334155",
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name={`q${questionNumber}`}
                                                value={value}
                                                checked={selectedValue === value}
                                                onChange={() => handleAnswer(questionNumber, value)}
                                                style={{ display: "none" }}
                                            />
                                            {value}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </section>

                <section style={styles.card}>
                    <h2 style={styles.sectionTitle}>自由記述</h2>

                    <label style={styles.label}>
                        スタンプラリーにおいてよかった点があれば、ご自由にお書きください
                    </label>
                    <textarea
                        value={goodPoint}
                        onChange={(e) => setGoodPoint(e.target.value)}
                        style={styles.textarea}
                    />
                    <label style={styles.label}>
                        スタンプラリーにおいて改善してほしい点があれば、ご自由にお書きください
                    </label>
                    <textarea
                        value={improvePoint}
                        onChange={(e) => setImprovePoint(e.target.value)}
                        style={styles.textarea}
                    />
                    <label style={styles.label}>
                        今後追加してほしい機能や投票してみたいテーマがあればご自由に記入してください
                    </label>
                    <textarea
                        value={futureRequest}
                        onChange={(e) => setFutureRequest(e.target.value)}
                        style={styles.textarea}
                    />
                </section>
                <section style={styles.noticeCard}>
                    <p style={{ margin: 0 }}>
                        オープンキャンパス終了後もアプリは残るため、チャット機能や投票機能などを自由に活用できます。
                    </p>
                </section>
                <div style={styles.actionRow}>
                    <button onClick={() => router.push("/dashboard")} style={styles.outlineButton}>
                        ダッシュボードに戻る
                    </button>

                    <button onClick={handleSumbit} disabled={loading} style={styles.primaryButton}>
                        {loading ? "送信中..." : "アンケートを送信する"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: {
        minHeight: "100vh",
        backgroundColor: "f8fafc",
        padding: "32px",
        boxSizing: "border-box",
    },
    container: {
        maxWidth: "900px",
        margin: "0 auto",
    },
    headerCard: {
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
    },
    kicker: {
        color: "#2563eb",
        fontWeight: "bold",
        fontSize: "14px",
        margin: "0 0 8px",
    },
    title: {
        margin: 0,
        color: "#0f172a",
        fontSize: "30px",
    },
    subtitle: {
        color: "#64748b",
        lineHeight: 1.7,
    },
    scaleBox: {
        display: "grid",
        gap: "6px",
        backgroundColor: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "14px",
        color: "#475569",
        fontSize: "14px",
    },
    card: {
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
    },
    questionBlock: {
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: "18px",
        marginBottom: "18px",
    },
    questionText: {
        fontWeight: "bold",
        color: "#0f172a",
        lineHeight: 1.6,
    },
    radioRow: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
    },
    radioLabel: {
        width: "48px",
        height: "42px",
        border: "2px solid #e5e7eb",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        cursor: "pointer",
    },
    sectionTitle: {
        marginTop: 0,
        color: "#0f172a",
    },
    label: {
        display: "block",
        fontWeight: "bold",
        color: "#334155",
        marginTop: "16px",
        marginBottom: "8px",
        lineHeight: 1.6,
    },
    textarea: {
        width: "100%",
        minHeight: "100px",
        padding: "12px",
        borderRadius: "12px",
        border: "1px solid #cbd5e1",
        boxSizing: "border-box",
        resize: "vertical",
    },
    noticeCard: {
        backgroundColor: "#eff6ff",
        border: "1px solid #bfdbfe",
        color: "#1e40af",
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "20px",
        fontWeight: "bold",
        lineHeight: 1.6,
    },
    actionRow: {
        display: "flex",
        gap: "12px",
        justifyContent: "flex-end",
        flexWrap: "wrap",
    },
    outlineButton: {
        padding: "12px 20px",
        borderRadius: "999px",
        border: "1px solid #2563eb",
        backgroundColor: "#ffffff",
        color: "#2563eb",
        fontWeight: "bold",
        cursor: "pointer",
    },
    primaryButton: {
        padding: "12px 20px",
        borderRadius: "999px",
        border: "none",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        fontWeight: "bold",
        cursor: "pointer",
    },
};