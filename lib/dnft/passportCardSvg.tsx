import { PassportMap } from "@/components/PassportMap";

type Spot = {
    spotName: string;
    floor: string;
};

type PassportCardSvgProps = {
    level: number;
    title: string;
    stampCount: number;

    spots: Spot[];
    visitedSpots: string[];
};

function getLevelColor(level: number) {
    if (level >= 4) return "#ec4899";
    if (level === 3) return "#f59e0b";
    if (level === 2) return "#8b5cf6";
    if (level === 1) return "#3b82f6";

    return "#9ca3af";
}

export function PassportCardSvg({
    level,
    title,
    stampCount,
}: PassportCardSvgProps) {
    const levelColor = getLevelColor(level);

    return (
        <svg
            width="320"
            height="460"
            viewBox="0 0 320 460"
            xmlns="https://www.w3.org/2000/svg"
            >
                <rect
                    x="10"
                    y="10"
                    width="300"
                    height="400"
                    rx="18"
                    fill="#ffffff"
                    stroke={levelColor}
                    strokeWidth="5"
                />

                <text
                    x="160"
                    y="55"
                    textAnchor="middle"
                    fontSize="20"
                    fontWeight="bold"
                    fill={levelColor}
                >
                    OC Passport
                </text>

                <text
                    x="160"
                    y="82"
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#111827"
                >
                    {title}
                </text>

                <text
                    x="160"
                    y="115"
                    textAnchor="middle"
                    fontSize="14"
                    fill="#374151"
                >
                    Level {level}
                </text>

                <rect
                    x="45"
                    y="140"
                    width="230"
                    height="210"
                    rx="12"
                    fill="#f9fafb"
                    stroke="#d1d5db"
                />
                <text
                    x="160"
                    y="245"
                    textAnchor="middle"
                    fontSize="14"
                    fill="#6b7280"
                >
                    ここに研究室マップを描画
                </text>

                <text
                    x="160"
                    y="390"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="bold"
                    fill={levelColor}
                >
                    {stampCount} Stamp
                </text>
            </svg>
    );
}