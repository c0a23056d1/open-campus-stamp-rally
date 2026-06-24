export type DnftMetadataInput = {
  nftId: string;
  level: number;
  title: string;
  stampCount: number;
  visitedSpots: string[];
};

export function buildDnftMetadata({
  nftId,
  level,
  title,
  stampCount,
  visitedSpots,
}: DnftMetadataInput) {
  return {
    name: `OC Passport Lv.${level}`,
    description: `Open Campus Stamp Rally Passport - ${title}`,
    image: `/passport/level-${level}.png`,
    level,
    title,
    stampCount,
    visitedSpots,
    attributes: [
      {
        trait_type: "Level",
        value: level,
      },
      {
        trait_type: "Title",
        value: title,
      },
      {
        trait_type: "Stamp Count",
        value: stampCount,
      },
      {
        trait_type: "Visited Spots",
        value: visitedSpots,
      },
    ],
  };
}