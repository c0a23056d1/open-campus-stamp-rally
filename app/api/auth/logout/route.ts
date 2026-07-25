import { NextResponse } from "next/server";
import { deleteCurrentSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    await deleteCurrentSession();

    return NextResponse.json({
      message: "ログアウトしました",
    });
  } catch (error) {
    console.error(
      "ログアウト処理に失敗しました:",
      error
    );

    return NextResponse.json(
      {
        message: "ログアウト処理に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}