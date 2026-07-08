import sharp from "sharp";

type FavoriteLab = {
  spotName: string;
  rating: number;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function renderStars(rating: number) {
  const filled = "★".repeat(rating);
  const empty = "☆".repeat(5 - rating);
  return filled + empty;
}

export async function generateFavoriteLabsPng(
  favoriteLabs: FavoriteLab[],
  color: string
): Promise<Buffer | null> {
  if (favoriteLabs.length === 0) return null;

  const rowsSvg = favoriteLabs
    .slice(0, 3)
    .map((lab, index) => {
      const y = 34 + index * 18;

      return `
        <text x="10" y="${y}" font-size="10" font-weight="bold" fill="${color}">
          ${renderStars(lab.rating)}
        </text>
        <text x="78" y="${y}" font-size="10" font-weight="bold" fill="#374151">
          ${escapeXml(lab.spotName)}
        </text>
      `;
    })
    .join("");

  const svg = `
    <svg width="190" height="88" viewBox="0 0 190 88" xmlns="http://www.w3.org/2000/svg">
      <text x="95" y="14" text-anchor="middle" font-size="11" font-weight="bold" fill="#374151">
        Favorite Labs
      </text>
      ${rowsSvg}
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}