import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("セッション確認エラー:", error);

    return NextResponse.json(
      {
        authenticated: false,
      },
      { status: 401 }
    );
  }
}