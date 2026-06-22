import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        wallet: {
            create: {
                symbolAddress: `TEMP_ADDRESS_${Date.now()}`,
                symbolPublicKey: `TEMP_PUBLIC_KEY_${Date.now()}`,
                encryptedPrivateKey: `TEMP_ENCRYPTED_PRIVATE_KEY_${Date.now()}`,
            },
        },
        nft: {
            create: {
                nftId: `OC_PASS_${Date.now()}`,
                level: 0,
                title: "Beginner",
                stampCount: 0,
            },
        },
      },
      include: {
        wallet: true,
        nft: true,
      },
    });

    return NextResponse.json({
      message: "ユーザー登録成功",
      userId: user.id,
      name: user.name,
      email: user.email,
      wallet: user.wallet,
      nft: user.nft,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "ユーザー登録失敗" },
      { status: 500 }
    );
  }
}