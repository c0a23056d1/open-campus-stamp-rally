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

function getLevelIcon(level: number) {
    if (level >= 4) return "♛";
    if (level >= 3) return "★";
    if (level >= 2) return "◆";
    if (level >= 1) return "✦";

    return "o";
}

function getMedalIcon(level: number) {
    if (level >= 4) return "♛";
    if (level >= 3) return "★";
    if (level >= 2) return "◆";
    if (level >= 1) return "✦";

    return "o";
}

function escapeXml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&apos;");
}
function renderLevel0Frame(levelColor: string) {
  return `
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
  `;
}

function renderLevel1Frame(levelColor: string) {
  return `
    ${renderLevel0Frame(levelColor)}

    <rect
      x="22"
      y="22"
      width="276"
      height="376"
      rx="14"
      fill="none"
      stroke="${levelColor}"
      stroke-width="2"
      opacity="0.55"
    />

    <path d="M32 52 L32 32 L52 32" fill="none" stroke="${levelColor}" stroke-width="3" stroke-linecap="round" />
    <path d="M268 32 L288 32 L288 52" fill="none" stroke="${levelColor}" stroke-width="3" stroke-linecap="round" />
    <path d="M32 368 L32 388 L52 388" fill="none" stroke="${levelColor}" stroke-width="3" stroke-linecap="round" />
    <path d="M268 388 L288 388 L288 368" fill="none" stroke="${levelColor}" stroke-width="3" stroke-linecap="round" />
  `;
}

function renderLevel2Frame(levelColor: string) {
  return `
    ${renderLevel1Frame(levelColor)}

    <line x1="120" y1="32" x2="145" y2="32" stroke="${levelColor}" stroke-width="2" stroke-linecap="round" />
    <line x1="175" y1="32" x2="200" y2="32" stroke="${levelColor}" stroke-width="2" stroke-linecap="round" />
    <circle cx="160" cy="32" r="5" fill="#ffffff" stroke="${levelColor}" stroke-width="2" />

    <line x1="120" y1="388" x2="145" y2="388" stroke="${levelColor}" stroke-width="2" stroke-linecap="round" />
    <line x1="175" y1="388" x2="200" y2="388" stroke="${levelColor}" stroke-width="2" stroke-linecap="round" />
    <circle cx="160" cy="388" r="5" fill="#ffffff" stroke="${levelColor}" stroke-width="2" />
  `;
}

function renderLevel3Frame(levelColor: string) {
  return `
    ${renderLevel2Frame(levelColor)}

    <text x="55" y="345" font-size="14" fill="${levelColor}" opacity="0.6">✦</text>
    <text x="265" y="345" font-size="14" fill="${levelColor}" opacity="0.6">✦</text>

    <polygon points="160,18 166,28 154,28" fill="${levelColor}" opacity="0.9" />
    <polygon points="160,402 166,392 154,392" fill="${levelColor}" opacity="0.9" />
  `;
}

function renderLevel4Frame(levelColor: string) {
  return `
    ${renderLevel3Frame(levelColor)}
  `;
}

function renderFrame(level: number) {
  const levelColor = getLevelColor(level);

  if (level >= 4) return renderLevel4Frame(levelColor);
  if (level === 3) return renderLevel3Frame(levelColor);
  if (level === 2) return renderLevel2Frame(levelColor);
  if (level === 1) return renderLevel1Frame(levelColor);

  return renderLevel0Frame(levelColor);
}

export function renderPassportSvg(props: RenderPassportSvgProps) {
    const levelColor = getLevelColor(props.level);
    const levelIcon = getLevelIcon(props.level);
    const medalIcon = getMedalIcon(props.level);
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
    ${renderFrame(props.level)}
    <circle cx="160" cy="34" r="16" fill="#ffffff" stroke="${levelColor}" stroke-width="2" />
    <text x="160" y="39" text-anchor="middle" font-size="16" font-weight="bold" fill="${levelColor}">
        ${levelIcon}
    </text>
    <text x="160" y="68" text-anchor="middle" font-size="20" font-weight="bold" fill="${levelColor}">
        OC Passport
    </text>

    <text x="160" y="95" text-anchor="middle" font-size="14" font-weight="bold" fill="#111827">
        ${escapeXml(props.title)}
    </text>

    <text x="160" y="128" text-anchor="middle" font-size="14" fill="#374151">
        Level ${props.level}
    </text>

    <g transform= "translate(25, 140) scale(0.8)">
        <text x="20" y="63" font-size="13" font-weight="bold">8F</text>
        <text x="20" y="113" font-size="13" font-weight="bold">7F</text>
        <text x="20" y="163" font-size="13" font-weight="bold">6F</text>
        ${spotsSvg}
    </g>

    <text x="160" y="370" text-anchor="middle" font-size="18" font-weight="bold" fill="${levelColor}">
        ${props.stampCount} Stamp
    </text>

    <circle cx="260" cy="370" r="18" fill="#ffffff" stroke="${levelColor}" stroke-width="3" />
    <circle cx="260" cy="370" r="12" fill="${levelColor}" opacity="0.15" />
    <text x="260" y="376" text-anchor="middle" font-size="18" font-weight="bold" fill="${levelColor}">
        ${medalIcon}
    </text>
</svg>`;
}