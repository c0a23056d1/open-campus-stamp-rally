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
    spots,
    visitedSpots,
}: PassportCardSvgProps) {
    const levelColor = getLevelColor(level);

    return (
        <svg
            width="320"
            height="460"
            viewBox="0 0 320 460"
            xmlns="http://www.w3.org/2000/svg"
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

                <g transform="translate(25, 140) scale(0.8)">
                    <PassportMap
                        spots={spots}
                        visitedSpots={visitedSpots}
                        level={level}
                        x={0}
                        y={0}
                    />
                </g>
                <text
                    x="160"
                    y="370"
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