// import { programs as metaplexPrograms } from "@metaplex/js";
// import type { MetadataJson, MetadataJsonAttribute } from "@metaplex/js";
// import { PublicKey } from "@solana/web3.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";
// import shallow from "zustand/shallow.js";

// import { Protocol } from "../../config";
// import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

// import { useSolanaConnection } from "./useSolanaConnection";
import { useSolanaWallet } from "./useSolanaWallet";

// const {
//   metadata: { Metadata },
// } = metaplexPrograms;

export interface NftAttribute {
  readonly traitType: string;
  readonly value: string;
  readonly rarity: number;
}

export interface NftData {
  // readonly metadata: metaplexPrograms.metadata.MetadataData;
  readonly image: string;
  readonly attributes: readonly NftAttribute[];
}

// interface uriPayload {
//   readonly image: string;
//   readonly attributes: readonly NftAttribute[];
// }

// const fetchNftUri = async (uri: string): Promise<uriPayload> => {
//   const uriPayload = await fetch(uri).then<MetadataJson>((rawData) =>
//     rawData.json(),
//   );
//   const attributesWithRarity = !uriPayload.attributes
//     ? []
//     : uriPayload.attributes.map(
//         (attribute: MetadataJsonAttribute): NftAttribute => {
//           return {
//             traitType: attribute.trait_type,
//             value: attribute.value,
//             // TODO: Need to fetch this value
//             rarity: 5,
//           };
//         },
//       );
//   return {
//     image: uriPayload.image,
//     attributes: attributesWithRarity,
//   };
// };

export const useAccountNfts = (): UseQueryResult<readonly NftData[], Error> => {
  const { env } = useEnvironment();
  // const config = useEnvironment(selectConfig, shallow);
  // const { otterTotCollection } = config.chains[Protocol.Solana][0];
  // const solanaConnection = useSolanaConnection();
  const ownerAddress = useSolanaWallet().address;
  return useQuery(
    ["accountNfts", env, ownerAddress],
    // eslint-disable-next-line @typescript-eslint/require-await
    async (): Promise<readonly NftData[]> => {
      // TODO: Update metaplex
      throw new Error("Not implemented");
      // if (!ownerAddress) {
      //   // Note, returns 0 nfts if wallet is not connected.
      //   return [];
      // }
      // const userNfts = await Metadata.findDataByOwner(
      //   solanaConnection.rawConnection,
      //   new PublicKey(ownerAddress),
      // );
      // const userSwimNfts = userNfts.filter(
      //   (nftMetadata) => nftMetadata.collection?.key === otterTotCollection,
      // );
      // const nftData = await Promise.all(
      //   userSwimNfts.map(async (metadata) => {
      //     const { image, attributes } = await fetchNftUri(metadata.data.uri);
      //     return {
      //       metadata,
      //       image,
      //       attributes,
      //     };
      //   }),
      // );
      // return [...nftData].sort((a, b) =>
      //   a.metadata.data.name.localeCompare(b.metadata.data.name),
      // );
    },
  );
};
