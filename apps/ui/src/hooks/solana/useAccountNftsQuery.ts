import { programs as metaplexPrograms } from "@metaplex/js";
import type {
  MetadataJson,
  MetadataJsonAttribute,
} from "@metaplex/js/lib/types";
import { PublicKey } from "@solana/web3.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { Env } from "../../config";
import {
  SWIM_NUMBERS_COLLECTION_DEVNET,
  SWIM_NUMBERS_COLLECTION_MAINNET,
} from "../../config/nft";
import { useEnvironment, useSolanaConnection } from "../../contexts";

const {
  metadata: { Metadata },
} = metaplexPrograms;

export interface NftAttribute {
  readonly traitType: string;
  readonly value: string;
  readonly rarity: number;
}

export interface NftData {
  readonly metadata: metaplexPrograms.metadata.MetadataData;
  readonly image: string;
  readonly attributes: readonly NftAttribute[];
}

const getNftCollectionId = (env: Env): string => {
  switch (env) {
    case Env.Mainnet: {
      return SWIM_NUMBERS_COLLECTION_MAINNET;
    }
    case Env.Devnet: {
      return SWIM_NUMBERS_COLLECTION_DEVNET;
    }
    default:
      throw new Error("fucu");
  }
};

export const useAccountNfts = (
  ownerAddress: string | null,
): UseQueryResult<readonly NftData[], Error> => {
  const solanaConnection = useSolanaConnection();
  const { env } = useEnvironment();
  return useQuery(["accountNfts", env, ownerAddress], async () => {
    if (!ownerAddress) {
      return null;
    }
    const rawNftData = (
      await Metadata.findDataByOwner(
        solanaConnection.rawConnection,
        new PublicKey(ownerAddress),
      )
    ).filter((md) => md.collection?.key === getNftCollectionId(env));
    const nftData = await Promise.all(
      rawNftData.map(async (metadata) => {
        const uriPayload: MetadataJson = await fetch(metadata.data.uri).then(
          (rawData) => rawData.json(),
        );
        const attributesWithRarity = uriPayload.attributes?.map(
          (attribute: MetadataJsonAttribute): NftAttribute => {
            return {
              traitType: attribute.trait_type,
              value: attribute.value,
              // TODO: Need to fetch this value
              rarity: 5,
            };
          },
        );

        return {
          metadata: metadata,
          image: uriPayload.image,
          attributes: attributesWithRarity,
        };
      }),
    );
    // eslint-disable-next-line functional/immutable-data
    return nftData.sort((a, b) =>
      a.metadata.data.name.localeCompare(b.metadata.data.name),
    );
  });
};
