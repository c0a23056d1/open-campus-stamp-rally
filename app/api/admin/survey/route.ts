import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const QUESTION_COUNT = 16;

/**
 * 管理者権限を確認する
 */
async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      isAdmin: true,
    },
  });

  return user?.isAdmin === true;
}

/**
 * dNFT側とアンケート側のタグ表記を、
 * 比較用の日本語表記へ統一する
 */
function normalizeInterestTag(tag: string) {
  const normalizedTag = tag.trim();

  const labels: Record<string, string> = {
    AI: "AI・機械学習",
    "AI・機械学習": "AI・機械学習",

    Game: "ゲーム",
    ゲーム: "ゲーム",

    Robot: "ロボット",
    ロボット: "ロボット",

    Security: "情報セキュリティ",
    情報セキュリティ: "情報セキュリティ",

    Data: "データサイエンス",
    データサイエンス: "データサイエンス",

    Media: "音声・画像処理",
    "音声・画像処理": "音声・画像処理",

    Human: "人間・心理",
    "人間・心理": "人間・心理",

    Biometrics: "生体認証",
    生体認証: "生体認証",

    IoT: "IoT・センシング",
    "IoT・センシング": "IoT・センシング",

    Simulation: "数理・シミュレーション",
    "数理・シミュレーション": "数理・シミュレーション",

    Service: "サービス・経営",
    "サービス・経営": "サービス・経営",

    "Well-being": "Well-being・社会",
    "Well-being・社会": "Well-being・社会",
  };

  return labels[normalizedTag] ?? normalizedTag;
}

/**
 * JSON文字列として保存された文字列配列を安全に読み取る
 */
function parseStringArray(
  value: string | null | undefined
): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string => typeof item === "string"
    );
  } catch (error) {
    console.error("配列JSONの解析に失敗しました:", error);
    return [];
  }
}

/**
 * NFTのmetadataJsonから興味タグを取得する
 */
function getDnftInterestTags(
  metadataJson: string | null | undefined
): string[] {
  if (!metadataJson) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(metadataJson);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("interestTags" in parsed)
    ) {
      return [];
    }

    const interestTags = (
      parsed as {
        interestTags?: unknown;
      }
    ).interestTags;

    if (!Array.isArray(interestTags)) {
      return [];
    }

    return interestTags
      .filter(
        (tag): tag is string => typeof tag === "string"
      )
      .map(normalizeInterestTag)
      .filter(
        (tag, index, array) =>
          tag !== "" && array.indexOf(tag) === index
      )
      .slice(0, 3);
  } catch (error) {
    console.error("NFTメタデータの解析に失敗しました:", error);
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminUserId = Number(
      searchParams.get("adminUserId")
    );

    if (
      !Number.isInteger(adminUserId) ||
      adminUserId <= 0
    ) {
      return NextResponse.json(
        {
          message: "有効なadminUserIdが必要です",
        },
        {
          status: 400,
        }
      );
    }

    const isAdmin = await checkAdmin(adminUserId);

    if (!isAdmin) {
      return NextResponse.json(
        {
          message: "管理者権限がありません",
        },
        {
          status: 403,
        }
      );
    }

    /**
     * アンケート回答と、
     * 回答ユーザーのNFTメタデータを取得する
     */
    const responses =
      await prisma.surveyResponse.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              nft: {
                select: {
                  metadataJson: true,
                },
              },
            },
          },
        },
      });

    const totalResponses = responses.length;

    /**
     * Q1〜Q16の平均値と分布を計算する
     */
    const questionStats = Array.from(
      {
        length: QUESTION_COUNT,
      },
      (_, index) => {
        const questionNumber = index + 1;
        const questionKey =
          `q${questionNumber}` as keyof (typeof responses)[number];

        const values = responses
          .map((response) => response[questionKey])
          .filter(
            (value): value is number =>
              typeof value === "number"
          );

        const average =
          values.length === 0
            ? 0
            : Math.round(
                (values.reduce(
                  (sum, value) => sum + value,
                  0
                ) /
                  values.length) *
                  10
              ) / 10;

        const distribution = [1, 2, 3, 4, 5].map(
          (score) => ({
            score,
            count: values.filter(
              (value) => value === score
            ).length,
          })
        );

        return {
          questionNumber,
          average,
          distribution,
        };
      }
    );

    /**
     * 各ユーザーの
     * dNFT興味タグとアンケート回答を比較する
     */
    const interestTagAnalysis = responses.map(
      (response) => {
        const surveyTags = parseStringArray(
          response.interestTagsJson
        )
          .map(normalizeInterestTag)
          .filter(
            (tag, index, array) =>
              tag !== "" && array.indexOf(tag) === index
          )
          .slice(0, 3);

        const dnftTags = getDnftInterestTags(
          response.user.nft?.metadataJson
        );

        const matchedTags = dnftTags.filter((tag) =>
          surveyTags.includes(tag)
        );

        const matchCount = matchedTags.length;

        /**
         * 3件中何件一致したかを百分率にする
         *
         * 0件：0%
         * 1件：33.3%
         * 2件：66.7%
         * 3件：100%
         */
        const matchRate =
          Math.round(
            (matchCount / 3) * 100 * 10
          ) / 10;

        return {
          responseId: response.id,

          user: {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
          },

          dnftTags,
          surveyTags,
          matchedTags,
          matchCount,
          matchRate,

          hasDnftTags: dnftTags.length > 0,
          hasThreeSurveyTags:
            surveyTags.length === 3,
        };
      }
    );

    /**
     * 平均値の対象は、
     * dNFTタグが存在し、アンケートで3件回答している人
     */
    const validInterestTagAnalysis =
      interestTagAnalysis.filter(
        (item) =>
          item.hasDnftTags &&
          item.hasThreeSurveyTags
      );

    const averageInterestMatchRate =
      validInterestTagAnalysis.length === 0
        ? 0
        : Math.round(
            (validInterestTagAnalysis.reduce(
              (sum, item) =>
                sum + item.matchRate,
              0
            ) /
              validInterestTagAnalysis.length) *
              10
          ) / 10;

    /**
     * 一致件数別の人数
     */
    const matchCountDistribution = [
      0,
      1,
      2,
      3,
    ].map((matchCount) => ({
      matchCount,
      matchRate:
        Math.round(
          (matchCount / 3) * 100 * 10
        ) / 10,
      userCount: validInterestTagAnalysis.filter(
        (item) =>
          item.matchCount === matchCount
      ).length,
    }));

    return NextResponse.json({
      totalResponses,
      questionStats,
      responses,

      interestTagAnalysis,
      averageInterestMatchRate,
      analyzedUserCount:
        validInterestTagAnalysis.length,
      matchCountDistribution,
    });
  } catch (error) {
    console.error(
      "アンケート分析APIでエラーが発生しました:",
      error
    );

    return NextResponse.json(
      {
        message:
          "アンケート分析データ取得に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}