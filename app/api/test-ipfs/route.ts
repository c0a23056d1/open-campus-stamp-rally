import { NextResponse } from "next/server";
import { generatePassportPng } from "@/lib/dnft/generatePassportPng";
import { uploadPngToPinata } from "@/lib/ipfs/uploadToPinata";
import { buildDnftMetadata } from "@/lib/dnftMetadata";

export async function GET() {
    const pngBuffer = await generatePassportPng({
        level: 4,
        title: "Ambassador",
        stampCount: 8,
        spots: [
            { spotName: "研究室A", floor: "6F" },
            { spotName: "研究室B", floor: "7F" },
            { spotName: "研究室C", floor: "7F" },
            { spotName: "研究室D", floor: "7F" },
            { spotName: "研究室E", floor: "6F" },
            { spotName: "研究室F", floor: "6F" },
            { spotName: "研究室G", floor: "8F" },
            { spotName: "研究室H", floor: "8F" },
        ],
        visitedSpots: ["研究室A", "研究室B", "研究室G"],
    });
    
    const cid = await uploadPngToPinata(
        pngBuffer,
        `oc-passport-test-${Date.now()}.png`
    );

    const metadata = buildDnftMetadata({
        nftId: "OC_PASS_TEST",
        level: 4,
        title: "Ambassador",
        stampCount: 8,
        visitedSpots: ["研究室A", "研究室B", "研究室G"],
        imageUrl: `ipfs://${cid}`,
    });

    return NextResponse.json({
        cid,
        metadata,
    });
}