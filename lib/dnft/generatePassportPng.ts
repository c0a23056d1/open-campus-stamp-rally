import sharp from "sharp";
import { renderPassportSvg, RenderPassportSvgProps } from "./renderPassportSvg";
import { generateInterestTagPng } from "./generateInterestTagPng";

function getLevelColor(level: number) {
  if (level >= 4) return "#ec4899";
  if (level === 3) return "#f59e0b";
  if (level === 2) return "#8b5cf6";
  if (level === 1) return "#3b82f6";

  return "#9ca3af";
}

export async function generatePassportPng(
  props: RenderPassportSvgProps
): Promise<Buffer> {
  const svg = renderPassportSvg(props);

  const basePngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  const levelColor = getLevelColor(props.level);

  const interestTagPng = await generateInterestTagPng(
    props.interestTags,
    levelColor
  );

  if (!interestTagPng) {
    return basePngBuffer;
  }

  const pngBuffer = await sharp(basePngBuffer)
    .composite([
      {
        input: interestTagPng,
        left: 70,
        top: 312,
      },
    ])
    .png()
    .toBuffer();

  return pngBuffer;
}