import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "メールアドレスまたはパスワードが違います" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { message: "メールアドレスまたはパスワードが違います" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "ログイン成功",
      userId: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "ログイン失敗" },
      { status: 500 }
    );
  }
}