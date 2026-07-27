import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    // Session Cookieから現在のユーザーを取得する
    const currentUser = await requireUser();

    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("spotId" in body) ||
      !("rating" in body)
    ) {
      return NextResponse.json(
        {
          message: "spotIdとratingが必要です",
        },
        {
          status: 400,
        }
      );
    }

    const spotId = Number(body.spotId);
    const ratingNumber = Number(body.rating);

    const comment =
      "comment" in body && typeof body.comment === "string"
        ? body.comment.trim()
        : "";

    if (!Number.isInteger(spotId) || spotId <= 0) {
      return NextResponse.json(
        {
          message: "正しいspotIdを指定してください",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(ratingNumber) ||
      ratingNumber < 1 ||
      ratingNumber > 5
    ) {
      return NextResponse.json(
        {
          message: "評価は1〜5の整数で入力してください",
        },
        {
          status: 400,
        }
      );
    }

    // 評価対象の研究室が存在するか確認
    const spot = await prisma.spot.findUnique({
      where: {
        id: spotId,
      },
    });

    if (!spot) {
      return NextResponse.json(
        {
          message: "研究室が見つかりません",
        },
        {
          status: 404,
        }
      );
    }

    // Sessionから取得した本人の訪問履歴を確認する
    const visited = await prisma.stampLog.findUnique({
      where: {
        userId_spotId: {
          userId: currentUser.id,
          spotId,
        },
      },
    });

    if (!visited) {
      return NextResponse.json(
        {
          message: "訪問していない研究室は評価できません",
        },
        {
          status: 403,
        }
      );
    }

    // 同じ研究室への評価があれば更新し、なければ新規作成する
    const spotRating = await prisma.spotRating.upsert({
      where: {
        userId_spotId: {
          userId: currentUser.id,
          spotId,
        },
      },
      update: {
        rating: ratingNumber,
        comment: comment || null,
      },
      create: {
        userId: currentUser.id,
        spotId,
        rating: ratingNumber,
        comment: comment || null,
      },
    });

    return NextResponse.json({
      message: "研究室評価を保存しました",
      spotRating,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          message:
            "認証されていません。もう一度認証してください。",
        },
        {
          status: 401,
        }
      );
    }

    console.error("研究室評価の保存に失敗しました:", error);

    return NextResponse.json(
      {
        message: "研究室評価の保存に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}