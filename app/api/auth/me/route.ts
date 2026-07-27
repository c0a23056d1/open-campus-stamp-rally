import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          message: "ログインしていません",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error(
      "ユーザー情報の取得に失敗しました:",
      error
    );

    return NextResponse.json(
      {
        message: "ユーザー情報の取得に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}