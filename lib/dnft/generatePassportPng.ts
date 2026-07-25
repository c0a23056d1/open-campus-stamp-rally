import path from "path";
import { Resvg } from "@resvg/resvg-js";
import {
  renderPassportSvg,
  type RenderPassportSvgProps,
} from "./renderPassportSvg";

export async function generatePassportPng(
  props: RenderPassportSvgProps
): Promise<Buffer> {
  const svg = renderPassportSvg(props);

  const fontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "NotoSansJP-Regular.ttf"
  );

  const resvg = new Resvg(svg, {
    font: {
      fontFiles: [fontPath],
      loadSystemFonts: false,
      defaultFontFamily: "NotoSansJP",
    },
  });

  return resvg.render().asPng();
}