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

const spotColors: Record<string, string> = {
    "研究室A": "#FCA5A5", // パステル赤
    "研究室B": "#FDBA74", // パステルオレンジ
    "研究室C": "#FDE68A", // パステル黄
    "研究室D": "#86EFAC", // パステル緑
    "研究室E": "#7DD3FC", // パステル水色
    "研究室F": "#93C5FD", // パステル青
    "研究室G": "#C4B5FD", // パステル紫
    "研究室H": "#F9A8D4", // パステルピンク
};

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
    if (level >= 2) return "✦";
    if (level >= 1) return "◆";

    return "o";
}

function getMedalIcon(level: number) {
    if (level >= 4) return "♛";
    if (level >= 3) return "★";
    if (level >= 2) return "✦";
    if (level >= 1) return "◆";

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

function renderOuterFrame(stroke: string) {
  return `
    <rect
      x="10"
      y="10"
      width="300"
      height="400"
      rx="18"
      fill="#ffffff"
      stroke="${stroke}"
      stroke-width="5"
    />
  `;
}

function renderInnerFrame(stroke: string) {
  return `
    <rect
      x="22"
      y="22"
      width="276"
      height="376"
      rx="14"
      fill="none"
      stroke="${stroke}"
      stroke-width="2"
      opacity="0.55"
    />
  `;
}

function renderCornerDecoration(stroke: string) {
  return `
    <!-- 左上 -->
    <text x="38" y="58" font-size="22" fill="${stroke}" opacity="0.9">✦</text>
    <text x="58" y="42" font-size="8" fill="${stroke}" opacity="0.75">✦</text>
    <text x="34" y="76" font-size="7" fill="${stroke}" opacity="0.6">✦</text>

    <!-- 右上 -->
    <text x="282" y="58" font-size="22" text-anchor="end" fill="${stroke}" opacity="0.9">✦</text>
    <text x="260" y="42" font-size="8" fill="${stroke}" opacity="0.75">✦</text>
    <text x="286" y="76" font-size="7" text-anchor="end" fill="${stroke}" opacity="0.6">✦</text>

    <!-- 左下 -->
    <text x="38" y="352" font-size="22" fill="${stroke}" opacity="0.9">✦</text>
    <text x="58" y="370" font-size="8" fill="${stroke}" opacity="0.75">✦</text>
    <text x="34" y="334" font-size="7" fill="${stroke}" opacity="0.6">✦</text>

    
  `;
}

function renderBottomEmblem(stroke: string, icon: string) {
  // エンブレム中心座標
  const cx = 260;
  const cy = 360; // ← ここを変更するだけで上下移動

  return `
    <!-- 外側の豪華リング -->
    <circle
      cx="${cx}"
      cy="${cy}"
      r="31"
      fill="none"
      stroke="${stroke}"
      stroke-width="1.2"
      opacity="0.6"
      stroke-dasharray="2 2"
    />

    <!-- 外側 -->
    <circle
      cx="${cx}"
      cy="${cy}"
      r="28"
      fill="#ffffff"
      stroke="${stroke}"
      stroke-width="3"
    />

    <!-- 中間リング -->
    <circle
      cx="${cx}"
      cy="${cy}"
      r="23"
      fill="none"
      stroke="${stroke}"
      stroke-width="1.5"
      opacity="0.45"
    />

    <!-- 内側の淡い円 -->
    <circle
      cx="${cx}"
      cy="${cy}"
      r="18"
      fill="${stroke}"
      opacity="0.12"
    />

    <!-- 内側の細いリング -->
    <circle
      cx="${cx}"
      cy="${cy}"
      r="15"
      fill="none"
      stroke="${stroke}"
      stroke-width="1.2"
      opacity="0.35"
    />

    <!-- 下リボン -->
    <path
      d="
        M${cx - 16} ${cy + 24}
        L${cx} ${cy + 14}
        L${cx + 16} ${cy + 24}
        L${cx + 10} ${cy + 35}
        L${cx} ${cy + 28}
        L${cx - 10} ${cy + 35}
        Z
      "
      fill="${stroke}"
      opacity="0.85"
    />

    <!-- 中央アイコン -->
    <text
      x="${cx}"
      y="${cy + 9}"
      text-anchor="middle"
      font-size="28"
      font-weight="bold"
      fill="${stroke}"
    >
      ${icon}
    </text>
  `;
}

function renderLevel0Frame(levelColor: string) {
  return `
    ${renderOuterFrame(levelColor)}
  `;
}

function renderLevel1Frame(levelColor: string) {
  return `
    ${renderLevel0Frame(levelColor)}
    ${renderInnerFrame(levelColor)}
    ${renderCornerDecoration(levelColor)}
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

    
    <polygon points="160,18 166,28 154,28" fill="${levelColor}" opacity="0.9" />
    <polygon points="160,402 166,392 154,392" fill="${levelColor}" opacity="0.9" />
  `;
}

function renderLevel4Frame(levelColor: string) {
  return `
    ${renderOuterFrame("url(#lv4Gradient)")}
    ${renderInnerFrame("url(#lv4Gradient)")}
    ${renderCornerDecoration("url(#lv4Gradient)")}

    

    <polygon points="160,18 166,28 154,28" fill="${levelColor}" opacity="0.9" />
    <polygon points="160,402 166,392 154,392" fill="${levelColor}" opacity="0.9" />
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

let fillcolor = "#f3f4f6";

if (isVisited) {
    if (props.level >= 4) {
        fillcolor = spotColors[spot.spotName] ?? levelColor;
    } else {
        fillcolor = levelColor;
    }
}

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
    <defs>
        <linearGradient
            id="lv4Gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
        >
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="35%" stop-color="#8b5cf6" />
            <stop offset="70%" stop-color="#ec4899" />
            <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
    </defs>

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

    ${renderBottomEmblem(levelColor, medalIcon)}
</svg>`;
}