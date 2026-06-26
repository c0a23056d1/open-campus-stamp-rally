type Spot = {
    spotName: string;
    floor: string;
};

export type RenderPassportSvgProps = {
    level: number;
    title: string;
    stampCount: number;
    spots: Spot[];
    visitedSpots: string[];
};

const spotLayouts = [
    { spotName: "研究室G", x: 70, y: 45},
    { spotName: "研究室H", x: 130, y: 45},

    { spotName: "研究室B", x: 70, y: 95},
    { spotName: "研究室C", x: 130, y: 95},
    { spotName: "研究室D", x: 190, y: 95},

    { spotName: "研究室A", x: 70, y: 145},
    { spotName: "研究室E", x: 130, y: 145},
    { spotName: "研究室F", x: 190, y: 145},
];

function getLevelColor(level: number){
    if (level >= 4) return "#ec4899";
    if (level === 3) return "#f59e0b";
    if (level === 2) return "#8b5cf6";
    if (level === 1) return "#3b82f6";
    return "#9ca3af";
}

function escapeXml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&apos;");
}

export function renderPassportSvg(props: RenderPassportSvgProps) {
    const levelColor = getLevelColor(props.level);
    const existingSpotNames = props.spots.map((spot) => spot.spotName);

    const visibleLayouts = spotLayouts.filter((layout) =>
        existingSpotNames.includes(layout.spotName)
    );

    const spotsSvg = visibleLayouts
        .map((spot) => {
            const isVisited = props.visitedSpots.includes(spot.spotName);
            const fillcolor = isVisited ? levelColor : "#f3f4f6";

            return `
                <g>
                    <title>${escapeXml(spot.spotName)}</title>
                    <rect
                        x="${spot.x}"
                        y="${spot.y}"
                        width="48"
                        height="28"
                        rx="6"
                        fill="${fillcolor}"
                        stroke="#cdb5e1"
                        stroke-width="1"
                    />
                    ${
                        isVisited
                            ?`<circle cx="${spot.x +24}" cy="${spot.y + 14}" r="4" fill="#ffffff" />`
                            : ""
                    }
                </g>
            `;
        })
        .join("");
    return `<?xml version="1.0" encoding="UTF-8"?>
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
        stroke="${levelColor}"
        stroke-width="5"
    />
    <text x="160" y="55" text-anchor="middle" font-size="20" font-weight="bold" fill="${levelColor}">
        OC Passport
    </text>
    <text x="160" y="115" text-anchor="middle" font-size="14" fill="#374151">
        Level ${props.level}
    </text>
    <g transform= "translate(25, 140) scale(0.8)">
        <text x="20" y="63" font-size="13" font-weighat="bold">8F</text>
        <text x="20" y="113" font-size="13" font-weighat="bold">7F</text>
        <text x="20" y="163" font-size="13" font-weighat="bold">6F</text>
        ${spotsSvg}
    </g>
    <text x="160" y="370" text-anchor="middle" font-size="18" font-weight="bold" fill="${levelColor}">
        ${props.stampCount} Stamp
    </text>
</svg>`;
}