type Spot = {
    spotName: string;
    floor: string;
}

type PassportMapProps = {
    spots: Spot[];
    visitedSpots: string[];
    level: number;
};

const spotLayouts = [
    { spotName: "研究室G", floor: "8F", x: 90, y: 45},
    { spotName: "研究室H", floor: "8F", x: 160, y: 45},

    { spotName: "研究室B", floor: "7F", x: 90, y: 95},
    { spotName: "研究室C", floor: "7F", x: 160, y: 95},
    { spotName: "研究室D", floor: "7F", x: 230, y: 95},

    { spotName: "研究室A", floor: "6F", x: 90, y: 145},
    { spotName: "研究室E", floor: "6F", x: 160, y: 145},
    { spotName: "研究室F", floor: "6F", x: 230, y: 145},
];

function getSpotColor(isVisited: boolean, level: number) {
    if (!isVisited)return "#e5e7eb";

    if (level >= 4) return "#ec4899";
    if (level === 3) return "#f59e0b";
    if (level === 2) return "#8b5cf6";
    if (level === 1) return "#3b82f6";

    return "#9ca3af";
}

export function PassportMap({ spots,visitedSpots, level }: PassportMapProps) {
    const existingSpotNames = spots.map((spot) => spot.spotName);

    const visibleLayouts = spotLayouts.filter((layout) =>
        existingSpotNames.includes(layout.spotName)
    );

    return (
        <svg
            width="300"
            height="190"
            viewBox="0 0 300 190"
            style={{
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                backgroundColor: "#ffffff",
            }}
        >
            <text x="12" y="26" fontSize="13" fontWeight="bold">
                8F
            </text>
            <text x="12" y="76" fontSize="13" fontWeight="bold">
                7F
            </text>
            <text x="12" y="126" fontSize="13" fontWeight="bold">
                6F
            </text>

            {visibleLayouts.map((spot) => {
                const isVisited = visitedSpots.includes(spot.spotName);
                const color = getSpotColor(isVisited, level);

                return (
                    <g key={spot.spotName}>
                        <title>{spot.spotName}</title>
                        
                        <rect
                            x={spot.x}
                            y={spot.y}
                            width="48"
                            height="28"
                            rx="6"
                            fill={isVisited ? color : "#f3f4f6"}
                            stroke="#cbd5e1"
                            strokeWidth="1"                        
                        />

                        {isVisited && (
                            <text
                                x={spot.x + 24}
                                y={spot.y + 19}
                                textAnchor="middle"
                                fontSize="13"
                                fill="#ffffff"
                            >
                                📍   
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}