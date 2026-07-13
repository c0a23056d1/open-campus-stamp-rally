type Spot = {
  spotName: string;
  floor: string;
  x: number;
  y: number;
  color: string;
  icon: string;
};

export type RenderPassportSvgProps = {
  level: number;
  title: string;
  stampCount: number;
  spots: Spot[];
  visitedSpots: string[];
  interestTags: string[];
  favoriteLabs: {
    spotName: string;
    rating: number;
  }[];
};

function getLevelColor(level: number) {
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
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getInterestTagEnglish(tag: string) {
  const labels: Record<string, string> = {
    "AI": "AI",
    "AI・機械学習": "AI",
    "ゲーム": "Game",
    "ロボット": "Robot",
    "情報セキュリティ": "Security",
    "データサイエンス": "Data",
    "音声・画像処理": "Media",
    "人間・心理": "Human",
    "生体認証": "Biometrics",
    "IoT・センシング": "IoT",
    "数理・シミュレーション": "Simulation",
    "サービス・経営": "Service",
    "Well-being・社会": "Well-being",
  };

  return labels[tag] ?? tag;
}

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function renderOuterFrame(stroke: string) {
  return `
    <rect x="10" y="10" width="300" height="460" rx="18"
      fill="#ffffff" stroke="${stroke}" stroke-width="5" />
  `;
}

function renderInnerFrame(stroke: string) {
  return `
    <rect x="22" y="22" width="276" height="436" rx="14"
      fill="none" stroke="${stroke}" stroke-width="2" opacity="0.55" />
  `;
}

function renderCornerDecoration(stroke: string) {
  return `
    <text x="38" y="58" font-size="22" fill="${stroke}" opacity="0.9">✦</text>
    <text x="58" y="42" font-size="8" fill="${stroke}" opacity="0.75">✦</text>
    <text x="34" y="76" font-size="7" fill="${stroke}" opacity="0.6">✦</text>

    <text x="282" y="58" font-size="22" text-anchor="end" fill="${stroke}" opacity="0.9">✦</text>
    <text x="260" y="42" font-size="8" fill="${stroke}" opacity="0.75">✦</text>
    <text x="286" y="76" font-size="7" text-anchor="end" fill="${stroke}" opacity="0.6">✦</text>

    <text x="38" y="422" font-size="22" fill="${stroke}" opacity="0.9">✦</text>
    <text x="58" y="440" font-size="8" fill="${stroke}" opacity="0.75">✦</text>
    <text x="34" y="404" font-size="7" fill="${stroke}" opacity="0.6">✦</text>
  `;
}

function renderBottomEmblem(stroke: string, icon: string) {
  const cx = 260;
  const cy = 425;

  return `
    <circle cx="${cx}" cy="${cy}" r="31" fill="none"
      stroke="${stroke}" stroke-width="1.2" opacity="0.6" stroke-dasharray="2 2" />

    <circle cx="${cx}" cy="${cy}" r="28" fill="#ffffff"
      stroke="${stroke}" stroke-width="3" />

    <circle cx="${cx}" cy="${cy}" r="23" fill="none"
      stroke="${stroke}" stroke-width="1.5" opacity="0.45" />

    <circle cx="${cx}" cy="${cy}" r="18" fill="${stroke}" opacity="0.12" />

    <circle cx="${cx}" cy="${cy}" r="15" fill="none"
      stroke="${stroke}" stroke-width="1.2" opacity="0.35" />

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

    <text x="${cx}" y="${cy + 9}" text-anchor="middle"
      font-size="28" font-weight="bold" fill="${stroke}">
      ${escapeXml(icon)}
    </text>
  `;
}

function renderLevel0Frame(levelColor: string) {
  return `${renderOuterFrame(levelColor)}`;
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

    <line x1="120" y1="488" x2="145" y2="488" stroke="${levelColor}" stroke-width="2" stroke-linecap="round" />
    <line x1="175" y1="488" x2="200" y2="488" stroke="${levelColor}" stroke-width="2" stroke-linecap="round" />
    <circle cx="160" cy="488" r="5" fill="#ffffff" stroke="${levelColor}" stroke-width="2" />
  `;
}

function renderLevel3Frame(levelColor: string) {
  return `
    ${renderLevel2Frame(levelColor)}
    <polygon points="160,18 166,28 154,28" fill="${levelColor}" opacity="0.9" />
    <polygon points="160,502 166,492 154,492" fill="${levelColor}" opacity="0.9" />
  `;
}

function renderLevel4Frame(levelColor: string) {
  return `
    ${renderOuterFrame("url(#lv4Gradient)")}
    ${renderInnerFrame("url(#lv4Gradient)")}
    ${renderCornerDecoration("url(#lv4Gradient)")}

    <polygon points="160,18 166,28 154,28" fill="${levelColor}" opacity="0.9" />
    <polygon points="160,502 166,492 154,492" fill="${levelColor}" opacity="0.9" />
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

/**
 * sharpで文字化けしやすい階数表示を、textではなく線で描画する
 */
function renderDigit6() {
  return `
    <path d="M11 3 C5 3 2 8 2 13 C2 17 5 20 8 20 C11 20 13 17 13 14 C13 11 11 9 8 9 C5 9 3 11 3 14"
      fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" />
  `;
}

function renderDigit7() {
  return `
    <path d="M1 2 H13 L5 20"
      fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  `;
}

function renderDigit8() {
  return `
    <circle cx="7" cy="6" r="4.5" fill="none" stroke="#111827" stroke-width="2" />
    <circle cx="7" cy="16" r="4.5" fill="none" stroke="#111827" stroke-width="2" />
  `;
}

function renderDigit9() {
  return `
    <circle cx="7" cy="6" r="5" fill="none" stroke="#111827" stroke-width="2" />
    <path d="M12 6 L12 20 L5 20"
      fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" />
  `;
}

function renderLetterF(x: number) {
  return `
    <path d="M${x} 2 V20 M${x} 2 H${x + 12} M${x} 11 H${x + 9}"
      fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" />
  `;
}

function normalizeFloor(floor: string) {
  return floor
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace("Ｆ", "F")
    .replace(/\s/g, "")
    .toUpperCase();
}

function renderFloorLabel(floor: string, y: number) {
  const normalized = normalizeFloor(floor);
  const match = normalized.match(/^(\d+)F$/);

  if (!match) return "";

  return `
    <text
      x="20"
      y="${y}"
      font-size="13"
      font-weight="bold"
      fill="#111827"
      font-family="sans-serif"
    >
      ${match[1]}F
    </text>
  `;
}

export function renderPassportSvg(props: RenderPassportSvgProps) {
  const levelColor = getLevelColor(props.level);
  const levelIcon = getLevelIcon(props.level);
  const medalIcon = getMedalIcon(props.level);

  const floors = [...new Set(props.spots.map((spot) => spot.floor))];

  const floorsSvg = floors
    .map((floor) => {
      const firstSpot = props.spots.find((spot) => spot.floor === floor);
      if (!firstSpot) return "";

      return renderFloorLabel(floor, firstSpot.y + 18);
    })
    .join("");

  const spotsSvg = props.spots
    .map((spot) => {
      
      const isVisited = props.visitedSpots.includes(spot.spotName);

      let fillcolor = "#f3f4f6";

      if (isVisited) {
        fillcolor = props.level >= 4 ? spot.color : levelColor;
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
            stroke="#cbd5e1"
            stroke-width="1"
          />

          ${
            isVisited
              ? `<circle cx="${spot.x + 24}" cy="${spot.y + 14}" r="4" fill="#ffffff" />`
              : ""
          }
        </g>
      `;
    })
    .join("");
  const favoriteLabsSvg = props.favoriteLabs
  .slice(0, 3)
  .map((lab, index) => {
    const y = 368 + index * 22;

    return `
      <text
        x="160"
        y="${y}"
        text-anchor="middle"
        font-size="11"
        font-weight="bold"
        fill="${levelColor}"
      >
        ${escapeXml(`${renderStars(lab.rating)}  ${lab.spotName}`)}
      </text>
    `;
  })
  .join("");
  
  return `<?xml version="1.0" encoding="UTF-8"?>

  <svg
  width="320"
  height="500"
  viewBox="0 0 320 500"
  xmlns="http://www.w3.org/2000/svg"
>
<defs>
  <linearGradient id="lv4Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#3b82f6" />
    <stop offset="35%" stop-color="#8b5cf6" />
    <stop offset="70%" stop-color="#ec4899" />
    <stop offset="100%" stop-color="#f59e0b" />
  </linearGradient>
</defs>

  ${renderFrame(props.level)}

  <circle cx="160" cy="34" r="16" fill="#ffffff" stroke="${levelColor}" stroke-width="2" />

  <text x="160" y="39" text-anchor="middle" font-size="16" font-weight="bold" fill="${levelColor}">
    ${escapeXml(levelIcon)}
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

  <g transform="translate(15, 135) scale(0.7)">
    ${floorsSvg}

    <text
      x="385"
      y="-18"
      text-anchor="middle"
      font-size="11"
      font-weight="bold"
      fill="#374151"
    >
      Katayanagi
    </text>

    <rect
      x="350"
      y="-10"
      width="70"
      height="88"
      rx="8"
      fill="none"
      stroke="#94a3b8"
      stroke-width="1.5"
      stroke-dasharray="4 3"
    />

    ${spotsSvg}
  </g>

  <text
    x="160"
    y="300"
    text-anchor="middle"
    font-size="11"
    font-weight="bold"
    fill="#374151"
  >
    Interest Tags
  </text>

  <text
    x="160"
    y="316"
    text-anchor="middle"
    font-size="11"
    font-weight="bold"
    fill="${levelColor}"
  >
    ${escapeXml(
      props.interestTags
        .slice(0, 3)
        .map(getInterestTagEnglish)
        .join(" / ")
    )}
  </text>
    <text
    x="160"
    y="345"
    text-anchor="middle"
    font-size="11"
    font-weight="bold"
    fill="#374151"
  >
    Favorite Labs
  </text>

  ${favoriteLabsSvg}

  <text
    x="160"
    y="445"
    text-anchor="middle"
    font-size="18"
    font-weight="bold"
    fill="${levelColor}"
  >
    ${props.stampCount} Stamp
  </text>

  ${renderBottomEmblem(levelColor, medalIcon)}
</svg>`;
  }