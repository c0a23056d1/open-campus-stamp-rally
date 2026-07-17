import { NextResponse } from "next/server";
import { createSymbolWallet } from "@/lib/symbolWallet";

export async function GET() {
  try {
    const wallet = await createSymbolWallet();

    return NextResponse.json({
      message: "operator wallet generated",
      wallet,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "failed to generate operator wallet" },
      { status: 500 }
    );
  }
}