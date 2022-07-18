import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";

import type { EcosystemId, TokenSpec } from "../../config";
import { Amount, findTokenAccountForMint } from "../../models";
import type { ReadonlyRecord } from "../../utils";
import { useErc20BalancesQuery } from "../evm/useErc20BalancesQuery";
import { useSolanaWallet, useSplTokenAccountsQuery } from "../solana";

const getContractAddressesByEcosystem = (
  tokenSpecs: readonly TokenSpec[],
): ReadonlyRecord<EcosystemId, readonly string[]> =>
  tokenSpecs.reduce<ReadonlyRecord<EcosystemId, readonly string[]>>(
    (accumulator, { detailsByEcosystem }) => {
      const [
        solanaAddress,
        ethereumAddress,
        bnbAddress,
        // avalancheAddress,
        // polygonAddress,
        // auroraAddress,
        // fantomAddress,
        // karuraAddress,
        // acalaAddress,
      ] = [
        "solana" as const,
        "ethereum" as const,
        "bnb" as const,
        // EcosystemId.Avalanche,
        // EcosystemId.Polygon,
        // EcosystemId.Aurora,
        // EcosystemId.Fantom,
        // EcosystemId.Karura,
        // EcosystemId.Acala,
      ].map(
        (ecosystemId) => detailsByEcosystem.get(ecosystemId)?.address ?? null,
      );
      return {
        solana: solanaAddress
          ? [...accumulator.solana, solanaAddress]
          : accumulator.solana,
        ethereum: ethereumAddress
          ? [...accumulator.ethereum, ethereumAddress]
          : accumulator.ethereum,
        bnb: bnbAddress ? [...accumulator.bnb, bnbAddress] : accumulator.bnb,
        // [EcosystemId.Avalanche]: avalancheAddress
        //   ? [...accumulator.avalanche, avalancheAddress]
        //   : accumulator.avalanche,
        // [EcosystemId.Polygon]: polygonAddress
        //   ? [...accumulator.polygon, polygonAddress]
        //   : accumulator.polygon,
        // [EcosystemId.Aurora]: auroraAddress
        //   ? [...accumulator.aurora, auroraAddress]
        //   : accumulator.aurora,
        // [EcosystemId.Fantom]: fantomAddress
        //   ? [...accumulator.fantom, fantomAddress]
        //   : accumulator.fantom,
        // [EcosystemId.Karura]: karuraAddress
        //   ? [...accumulator.karura, karuraAddress]
        //   : accumulator.karura,
        // [EcosystemId.Acala]: acalaAddress
        //   ? [...accumulator.acala, acalaAddress]
        //   : accumulator.acala,
      };
    },
    {
      solana: [],
      ethereum: [],
      bnb: [],
      // [EcosystemId.Avalanche]: [],
      // [EcosystemId.Polygon]: [],
      // [EcosystemId.Aurora]: [],
      // [EcosystemId.Fantom]: [],
      // [EcosystemId.Karura]: [],
      // [EcosystemId.Acala]: [],
    },
  );

const getEvmTokenIdAndBalance = (
  tokenSpec: TokenSpec,
  ecosystemId: EcosystemId,
  balances: readonly UseQueryResult<Decimal | null, Error>[],
  contractAddresses: readonly string[],
): readonly [string, Amount | null] => {
  const address = tokenSpec.detailsByEcosystem.get(ecosystemId)?.address;
  if (!address) {
    return [tokenSpec.id, null];
  }
  const index = contractAddresses.findIndex(
    (contractAddress) => contractAddress === address,
  );
  if (!balances[index]) {
    return [tokenSpec.id, null];
  }
  const { data: balance = null } = balances[index];
  return [
    tokenSpec.id,
    balance !== null
      ? Amount.fromAtomic(tokenSpec, balance, ecosystemId)
      : null,
  ];
};

export const useMultipleUserBalances = (
  tokenSpecs: readonly TokenSpec[],
): ReadonlyMap<string, Amount | null> => {
  const {
    solana,
    ethereum,
    bnb,
    // avalanche,
    // polygon,
    // aurora,
    // fantom,
    // karura,
    // acala,
  } = getContractAddressesByEcosystem(tokenSpecs);
  const { address: solanaWalletAddress } = useSolanaWallet();
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const solanaTokenAccounts = solana.map((tokenContractAddress) =>
    solanaWalletAddress !== null
      ? findTokenAccountForMint(
          tokenContractAddress,
          solanaWalletAddress,
          splTokenAccounts,
        )
      : null,
  );
  const ethereumBalances = useErc20BalancesQuery("ethereum", ethereum);
  const bnbBalances = useErc20BalancesQuery("bnb", bnb);
  // const avalancheBalances = useErc20BalancesQuery(
  //   EcosystemId.Avalanche,
  //   avalanche,
  // );
  // const polygonBalances = useErc20BalancesQuery(EcosystemId.Polygon, polygon);
  // const auroraBalances = useErc20BalancesQuery(EcosystemId.Aurora, aurora);
  // const fantomBalances = useErc20BalancesQuery(EcosystemId.Fantom, fantom);
  // const karuraBalances = useErc20BalancesQuery(EcosystemId.Karura, karura);
  // const acalaBalances = useErc20BalancesQuery(EcosystemId.Acala, acala);

  return new Map(
    tokenSpecs.map((tokenSpec, i) => {
      switch (tokenSpec.nativeEcosystem) {
        case "solana": {
          const tokenAccount = solanaTokenAccounts[i];
          return [
            tokenSpec.id,
            tokenAccount
              ? Amount.fromAtomicBn(tokenSpec, tokenAccount.amount, "solana")
              : null,
          ];
        }
        case "ethereum": {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            "ethereum",
            ethereumBalances,
            ethereum,
          );
        }
        case "bnb": {
          return getEvmTokenIdAndBalance(tokenSpec, "bnb", bnbBalances, bnb);
        }
        // case EcosystemId.Avalanche: {
        //   return getEvmTokenIdAndBalance(
        //     tokenSpec,
        //     EcosystemId.Avalanche,
        //     avalancheBalances,
        //     avalanche,
        //   );
        // }
        // case EcosystemId.Polygon: {
        //   return getEvmTokenIdAndBalance(
        //     tokenSpec,
        //     EcosystemId.Polygon,
        //     polygonBalances,
        //     polygon,
        //   );
        // }
        // case EcosystemId.Aurora: {
        //   return getEvmTokenIdAndBalance(
        //     tokenSpec,
        //     EcosystemId.Aurora,
        //     auroraBalances,
        //     aurora,
        //   );
        // }
        // case EcosystemId.Fantom: {
        //   return getEvmTokenIdAndBalance(
        //     tokenSpec,
        //     EcosystemId.Fantom,
        //     fantomBalances,
        //     fantom,
        //   );
        // }
        // case EcosystemId.Karura: {
        //   return getEvmTokenIdAndBalance(
        //     tokenSpec,
        //     EcosystemId.Karura,
        //     karuraBalances,
        //     karura,
        //   );
        // }
        // case EcosystemId.Acala: {
        //   return getEvmTokenIdAndBalance(
        //     tokenSpec,
        //     EcosystemId.Acala,
        //     acalaBalances,
        //     acala,
        //   );
        // }
        default:
          return [tokenSpec.id, null];
      }
    }),
  );
};
