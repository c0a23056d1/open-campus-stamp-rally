import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import path from "path";

function getInterestTagLabel(tag: string) {
  const labels: Record<string, string> = {
    "AI・機械学習": "AI・機械学習",
    "ゲーム": "ゲーム",
    "ロボット": "ロボット",
    "情報セキュリティ": "情報セキュリティ",
    "データサイエンス": "データサイエンス",
    "音声・画像処理": "音声・画像処理",
    "人間・心理": "人間・心理",
    "生体認証": "生体認証",
    "IoT・センシング": "IoT・センシング",
    "数理・シミュレーション": "数理・シミュレーション",
    "サービス・経営": "サービス・経営",
    "Well-being・社会": "Well-being・社会",
  };

  return labels[tag] ?? tag;
}

function getFontPath() {
  return path.join(
    process.cwd(),
    "public",
    "fonts",
    "NotoSansJP-Regular.ttf"
  );
}

export async function generateInterestTagPng(
  interestTags: string[],
  color: string
): Promise<Buffer | null> {
  if (interestTags.length === 0) return null;

  GlobalFonts.registerFromPath(getFontPath(), "NotoSansJP");

  const width = 190;
  const height = 52;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, width, height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = 'bold 11px "NotoSansJP"';
  ctx.fillStyle = "#374151";
  ctx.fillText("Interest Tags", width / 2, 13);

  const tagsText = interestTags
    .slice(0, 3)
    .map(getInterestTagLabel)
    .join(" / ");

  ctx.font = 'bold 10px "NotoSansJP"';
  ctx.fillStyle = color;
  ctx.fillText(tagsText, width / 2, 35);

  return canvas.toBuffer("image/png");
}