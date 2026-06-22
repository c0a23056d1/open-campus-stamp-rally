import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { createSymbolWallet } from "@/lib/symbolWallet";
import { encryptText } from "@/lib/crypto";

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
    const wallet = createSymbolWallet();
    const encryptedPrivateKey = encryptText(wallet.encryptedPrivateKey);
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        wallet: {
            create: {
                symbolAddress: wallet.symbolAddress,
                symbolPublicKey: wallet.symbolPublicKey,
                encryptedPrivateKey: encryptedPrivateKey,
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