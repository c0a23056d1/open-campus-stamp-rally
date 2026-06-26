import sharp from "sharp";
import { renderPassportSvg, RenderPassportSvgProps} from "./renderPassportSvg";

export async function generatePassportPng(
    props: RenderPassportSvgProps
): Promise<Buffer> {
    const svg = renderPassportSvg(props);

    const pngBuffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
    return pngBuffer;
}