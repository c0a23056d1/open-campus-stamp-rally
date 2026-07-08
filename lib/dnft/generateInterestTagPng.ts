import sharp from "sharp";
import fs from "fs";
import path from "path";

function getInterestTagLabel(tag: string) {
  const labels: Record<string, string> = {
    "AI・機械学習": "AI",
    "ゲーム": "Game",
    "ロボット": "Robot",
    "情報セキュリティ": "Security",
    "データサイエンス": "Data Science",
    "音声・画像処理": "Media",
    "人間・心理": "Human/Psychology",
    "生体認証": "Biometrics",
    "IoT・センシング": "IoT",
    "数理・シミュレーション": "Simulation",
    "サービス・経営": "Service/Management",
    "Well-being・社会": "Well-being",
  };

  return labels[tag] ?? tag;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getFontBase64() {
  const fontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "NotoSansJP-Regular.ttf"
  );

  return fs.readFileSync(fontPath).toString("base64");
}

export async function generateInterestTagPng(
  interestTags: string[],
  color: string
): Promise<Buffer | null> {
  if (interestTags.length === 0) return null;

  const tagsText = interestTags
    .slice(0, 3)
    .map(getInterestTagLabel)
    .join(" / ");

  const fontBase64 = getFontBase64();

  const svg = `
    <svg
      width="180"
      height="44"
      viewBox="0 0 180 44"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>
          @font-face {
            font-family: 'NotoSansJP';
            src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
            font-weight: normal;
            font-style: normal;
          }
        </style>
      </defs>

      <text
        x="90"
        y="15"
        text-anchor="middle"
        font-family="NotoSansJP"
        font-size="11"
        font-weight="bold"
        fill="#374151"
      >
        Interest Tags
      </text>

      <text
        x="90"
        y="34"
        text-anchor="middle"
        font-family="NotoSansJP"
        font-size="11"
        font-weight="bold"
        fill="${color}"
      >
        ${escapeXml(tagsText)}
      </text>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}