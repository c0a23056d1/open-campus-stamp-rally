type Spot = {
    spotName: string;
    floor: string;
}

type PassportMapProps = {
    spots: Spot[];
    visitedSpots: string[];
    level: number;
};

function getSpotColor(isVisited: boolean, level: number) {
    if (!isVisited)return "#e5e7eb";

    if (level >= 4) return "#ec4899";
    if (level === 3) return "#f59e0b";
    if (level === 2) return "#8b5cf6";
    if (level === 1) return "#3b82f6";

    return "#9ca3af";
}

export function PassportMap({ spots,visitedSpots, level }: PassportMapProps) {
    const floors = Array.from(new Set(spots.map((spot) => spot.floor))).sort(
        (a, b) => Number(b.replace("F", "")) - Number(a.replace("F", ""))
    );

    return (
        <div>
            <h2>研究室マップ</h2>
            <p>現在のレベル：{level}</p>
            <p>訪問済みスポット数：{visitedSpots.length}</p>

            <div
                style={{
                    border: "2px solid #d1d5db",
                    borderRadius: "16px",
                    padding: "16px",
                    maxWidth: "360px",
                    backgroundColor: "#ffffff",
                }}
            >
                {floors.map((floor) => (
                    <div
                        key={floor}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "10px",
                        }}
                    >
                        <strong style={{ width: "36px"}}>{floor}</strong>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 48px)",
                                gap: "8px",
                            }}
                        >
                        {spots
                            .filter((spot) => spot.floor === floor)
                            .map((spot) => {
                                const isVisited = visitedSpots.includes(spot.spotName);

                                return (
                                    <div
                                        key={spot.spotName}
                                        title={spot.spotName}
                                        style={{
                                            width: "48px",
                                            height: "28px",
                                            borderRadius: "6px",
                                            border:"1px solid #cbd5e1",
                                            backgroundColor: isVisited
                                                ? getSpotColor(true, level)
                                                : "#f3f4f6",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "14px",
                                            color: isVisited ? "#ffffff" : "#9ca3af",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {isVisited ? "📍" : ""}
                                    </div>  
                                );
                        })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}