export type DnftMetadataInput = {
  nftId: string;
  level: number;
  title: string;
  stampCount: number;
  visitedSpots: string[];
  imageUrl?: string;
  interestTags: string[];
  favoriteLabs: {spotName: string; rating: number;
}[];
};

export function buildDnftMetadata({
  nftId,
  level,
  title,
  stampCount,
  visitedSpots,
  imageUrl,
  interestTags,
  favoriteLabs,
}: DnftMetadataInput) {
  return {
    name: `OC Passport Lv.${level}`,
    description: `Open Campus Stamp Rally Passport - ${title}`,
    image: imageUrl ?? `/passport/level-${level}.png`,
    level,
    title,
    stampCount,
    visitedSpots,
    interestTags,
    favoriteLabs,
    attributes: [
      { trait_type: "NFT ID", value: nftId },
      { trait_type: "Level", value: level },
      { trait_type: "Title", value: title },
      { trait_type: "Stamp Count", value: stampCount },
      { trait_type: "Visited Spots", value: visitedSpots },
      {trait_type: "Interest Tags",value: interestTags },
      {trait_type: "Favorite Labs", value: favoriteLabs },
    ],
  };
}