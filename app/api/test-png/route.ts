import { NextResponse } from "next/server";
import { generatePassportPng } from "@/lib/dnft/generatePassportPng";

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
    
    return new NextResponse(new Uint8Array(pngBuffer), {
        headers: {
            "Content-Type": "image/png",
        },
    });
}