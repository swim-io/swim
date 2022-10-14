import fs from "fs";

import type { ChainId } from "@certusone/wormhole-sdk";
import { CHAINS, isEVMChain } from "@certusone/wormhole-sdk";
import { parse } from "csv-parse";

type Source =
  | "sol"
  | "eth"
  | "bsc"
  | "terra"
  | "matic"
  | "avax"
  | "oasis"
  | "algorand"
  | "ftm"
  | "aurora"
  | "karura"
  | "acala"
  | "klaytn"
  | "celo"
  | "near"
  | "moonbeam"
  | "terra2";

interface WrappedDetails {
  readonly solAddress: string;
  readonly solDecimals: string;
  readonly ethAddress: string;
  readonly ethDecimals: string;
  readonly bscAddress: string;
  readonly bscDecimals: string;
  readonly terraAddress: string;
  readonly terraDecimals: string;
  readonly maticAddress: string;
  readonly maticDecimals: string;
  readonly avaxAddress: string;
  readonly avaxDecimals: string;
  readonly oasisAddress: string;
  readonly oasisDecimals: string;
  readonly algorandAddress: string;
  readonly algorandDecimals: string;
  readonly ftmAddress: string;
  readonly ftmDecimals: string;
  readonly auroraAddress: string;
  readonly auroraDecimals: string;
  readonly karuraAddress: string;
  readonly karuraDecimals: string;
  readonly acalaAddress: string;
  readonly acalaDecimals: string;
  readonly klaytnAddress: string;
  readonly klaytnDecimals: string;
  readonly celoAddress: string;
  readonly celoDecimals: string;
  readonly nearAddress: string;
  readonly nearDecimals: string;
  readonly moonbeamAddress: string;
  readonly moonbeamDecimals: string;
  readonly terra2Address: string;
  readonly terra2Decimals: string;
}

interface CsvRecord extends WrappedDetails {
  readonly source: Source;
  readonly symbol: string;
  readonly name: string;
  readonly sourceAddress: string;
  readonly sourceDecimals: string;
  readonly coingeckoId: string;
  readonly logo: string;
}

interface WormholeTokenDetails {
  readonly chainId: ChainId;
  readonly address: string;
  readonly decimals: number;
}

interface WormholeToken {
  readonly symbol: string;
  readonly displayName: string;
  readonly logo: string;
  readonly coinGeckoId: string;
  readonly nativeDetails: WormholeTokenDetails;
  readonly wrappedDetails: readonly WormholeTokenDetails[];
}

const sourceToChainId: Record<Source, ChainId> = {
  sol: CHAINS.solana,
  eth: CHAINS.ethereum,
  bsc: CHAINS.bsc,
  terra: CHAINS.terra,
  matic: CHAINS.polygon,
  avax: CHAINS.avalanche,
  oasis: CHAINS.oasis,
  algorand: CHAINS.algorand,
  ftm: CHAINS.fantom,
  aurora: CHAINS.aurora,
  karura: CHAINS.karura,
  acala: CHAINS.acala,
  klaytn: CHAINS.klaytn,
  celo: CHAINS.celo,
  near: CHAINS.near,
  moonbeam: CHAINS.moonbeam,
  terra2: CHAINS.terra2,
};

const isChainSupported = (chainId: ChainId): boolean =>
  chainId === CHAINS.solana || isEVMChain(chainId);

const supportedSourceToChainId = Object.entries(sourceToChainId).reduce<
  Partial<Record<Source, ChainId>>
>(
  (accumulator, [source, chainId]) =>
    isChainSupported(chainId)
      ? {
          ...accumulator,
          [source]: chainId,
        }
      : accumulator,
  {},
);

const processWrappedDetails = (
  wrappedDetails: WrappedDetails,
): readonly WormholeTokenDetails[] =>
  Object.entries(supportedSourceToChainId).reduce(
    (accumulator: readonly WormholeTokenDetails[], [source, chainId]) => {
      const address: string =
        wrappedDetails[`${source}Address` as keyof WrappedDetails];
      const decimals: string =
        wrappedDetails[`${source}Decimals` as keyof WrappedDetails];
      if (!address || !decimals) {
        return accumulator;
      }
      return [
        ...accumulator,
        {
          chainId,
          address,
          decimals: parseInt(decimals, 10),
        },
      ];
    },
    [],
  );

const processRecord = ({
  source,
  symbol,
  name,
  logo,
  coingeckoId,
  sourceAddress,
  sourceDecimals,
  ...wrappedDetails
}: CsvRecord): WormholeToken => ({
  symbol,
  displayName: name,
  logo,
  coinGeckoId: coingeckoId,
  nativeDetails: {
    chainId: sourceToChainId[source],
    address: sourceAddress,
    decimals: parseInt(sourceDecimals, 10),
  },
  wrappedDetails: processWrappedDetails(wrappedDetails),
});

const main = async () => {
  const parser = fs
    .createReadStream(`${__dirname}/../tmp/wormholeTokenData.csv`)
    .pipe(
      parse({
        bom: true,
        columns: true,
      }),
    );

  // eslint-disable-next-line functional/prefer-readonly-type
  const processedRecords: WormholeToken[] = [];
  for await (const record of parser) {
    const processedRecord = processRecord(record as CsvRecord);
    const supportedChains = [
      processedRecord.nativeDetails,
      ...processedRecord.wrappedDetails,
    ].filter((details) => isChainSupported(details.chainId));
    if (supportedChains.length >= 2) {
      // eslint-disable-next-line functional/immutable-data
      processedRecords.push(processedRecord);
    }
  }

  return new Promise((resolve) => {
    fs.writeFile(
      `${__dirname}/../src/config/wormholeTokens.json`,
      JSON.stringify(processedRecords),
      resolve,
    );
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
