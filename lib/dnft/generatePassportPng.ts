import sharp from "sharp";
import {
  renderPassportSvg,
  type RenderPassportSvgProps,
} from "./renderPassportSvg";

export async function generatePassportPng(
  props: RenderPassportSvgProps
): Promise<Buffer> {
  const svg = renderPassportSvg(props);

  return sharp(Buffer.from(svg)).png().toBuffer();
}