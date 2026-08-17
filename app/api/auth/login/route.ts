import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "メールアドレス・パスワードログインは廃止されました。Web3認証をご利用ください。",
    },
    {
      status: 403,
    }
  );
}