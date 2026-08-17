import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = await requireAdmin();

    return NextResponse.json({
      message: "管理者確認成功",
      user: {
        id: admin.id,
        name: admin.name || "名無し",
        email: admin.email ?? "メール未登録",
        isAdmin: admin.isAdmin,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { message: "ログインが必要です" },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        { message: "管理者権限がありません" },
        { status: 403 }
      );
    }

    console.error("管理者確認エラー:", error);

    return NextResponse.json(
      { message: "処理に失敗しました" },
      { status: 500 }
    );
  }
}