type Spot = {
    spotName: string;
    floor: string;
    x: number;
    y: number;
    color: string;
    icon: string;
};

type PassportMapProps = {
    spots: Spot[];
    visitedSpots: string[];
    level: number;
    x?: number;
    y?: number;
};

function getSpotColor(isVisited: boolean, level: number) {
    if (!isVisited) return "#e5e7eb";

    if (level >= 4) return "#ec4899";
    if (level === 3) return "#f59e0b";
    if (level === 2) return "#8b5cf6";
    if (level === 1) return "#3b82f6";

    return "#9ca3af";
}

function getFloorLabelY(floor: string) {
    switch (floor) {
        case "9F":
            return 28;
        case "8F":
            return 63;
        case "7F":
            return 113;
        case "6F":
            return 163;
        default:
            return 213;
    }
}

export function PassportMap({
    spots,
    visitedSpots,
    level,
    x = 0,
    y = 0,
}: PassportMapProps) {
    // 重複しない階数一覧
    const floors = [...new Set(spots.map((spot) => spot.floor))].sort().reverse();

    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* 階数表示 */}
            {floors.map((floor) => (
                <text
                    key={floor}
                    x="20"
                    y={getFloorLabelY(floor)}
                    fontSize="13"
                    fontWeight="bold"
                >
                    {floor}
                </text>
            ))}

            {/* スポット描画 */}
            {spots.map((spot) => {
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
                            fill={isVisited ? spot.color : "#f3f4f6"}
                            stroke="#cbd5e1"
                            strokeWidth="1"
                        />

                        <text
                            x={spot.x + 24}
                            y={spot.y - 6}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#374151"
                        >
                            {spot.spotName}
                        </text>

                        {isVisited && (
                            <text
                                x={spot.x + 24}
                                y={spot.y + 19}
                                textAnchor="middle"
                                fontSize="13"
                                fill="#ffffff"
                            >
                                {spot.icon}
                            </text>
                        )}
                    </g>
                );
            })}
        </g>
    );
}