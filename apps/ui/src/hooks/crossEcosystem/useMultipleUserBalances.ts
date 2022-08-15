import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";

import type { EcosystemId, TokenSpec } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";
import { Amount, findTokenAccountForMint } from "../../models";
import { useErc20BalancesQuery } from "../evm";
import { useSolanaWallet, useSplTokenAccountsQuery } from "../solana";

const getContractAddressesByEcosystem = (
  tokenSpecs: readonly TokenSpec[],
): ReadonlyRecord<EcosystemId, readonly string[]> =>
  tokenSpecs.reduce<ReadonlyRecord<EcosystemId, readonly string[]>>(
    (accumulator, tokenSpec) => {
      const [
        solanaAddress,
        ethereumAddress,
        bnbAddress,
        avalancheAddress,
        polygonAddress,
        auroraAddress,
        fantomAddress,
        karuraAddress,
        acalaAddress,
      ] = [
        SOLANA_ECOSYSTEM_ID,
        EvmEcosystemId.Ethereum,
        EvmEcosystemId.Bnb,
        EvmEcosystemId.Avalanche,
        EvmEcosystemId.Polygon,
        EvmEcosystemId.Aurora,
        EvmEcosystemId.Fantom,
        EvmEcosystemId.Karura,
        EvmEcosystemId.Acala,
      ].map(
        (ecosystemId) =>
          getTokenDetailsForEcosystem(tokenSpec, ecosystemId)?.address ?? null,
      );
      return {
        [SOLANA_ECOSYSTEM_ID]: solanaAddress
          ? [...accumulator.solana, solanaAddress]
          : accumulator.solana,
        [EvmEcosystemId.Ethereum]: ethereumAddress
          ? [...accumulator.ethereum, ethereumAddress]
          : accumulator.ethereum,
        [EvmEcosystemId.Bnb]: bnbAddress
          ? [...accumulator.bnb, bnbAddress]
          : accumulator.bnb,
        [EvmEcosystemId.Avalanche]: avalancheAddress
          ? [...accumulator.avalanche, avalancheAddress]
          : accumulator.avalanche,
        [EvmEcosystemId.Polygon]: polygonAddress
          ? [...accumulator.polygon, polygonAddress]
          : accumulator.polygon,
        [EvmEcosystemId.Aurora]: auroraAddress
          ? [...accumulator.aurora, auroraAddress]
          : accumulator.aurora,
        [EvmEcosystemId.Fantom]: fantomAddress
          ? [...accumulator.fantom, fantomAddress]
          : accumulator.fantom,
        [EvmEcosystemId.Karura]: karuraAddress
          ? [...accumulator.karura, karuraAddress]
          : accumulator.karura,
        [EvmEcosystemId.Acala]: acalaAddress
          ? [...accumulator.acala, acalaAddress]
          : accumulator.acala,
      };
    },
    {
      [SOLANA_ECOSYSTEM_ID]: [],
      [EvmEcosystemId.Ethereum]: [],
      [EvmEcosystemId.Bnb]: [],
      [EvmEcosystemId.Avalanche]: [],
      [EvmEcosystemId.Polygon]: [],
      [EvmEcosystemId.Aurora]: [],
      [EvmEcosystemId.Fantom]: [],
      [EvmEcosystemId.Karura]: [],
      [EvmEcosystemId.Acala]: [],
    },
  );

const getEvmTokenIdAndBalance = (
  tokenSpec: TokenSpec,
  ecosystemId: EcosystemId,
  balances: readonly UseQueryResult<Decimal | null, Error>[],
  contractAddresses: readonly string[],
): readonly [string, Amount | null] => {
  const address = getTokenDetailsForEcosystem(tokenSpec, ecosystemId)?.address;
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
    avalanche,
    polygon,
    aurora,
    fantom,
    karura,
    acala,
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
  const ethereumBalances = useErc20BalancesQuery(
    EvmEcosystemId.Ethereum,
    ethereum,
  );
  const bnbBalances = useErc20BalancesQuery(EvmEcosystemId.Bnb, bnb);
  const avalancheBalances = useErc20BalancesQuery(
    EvmEcosystemId.Avalanche,
    avalanche,
  );
  const polygonBalances = useErc20BalancesQuery(
    EvmEcosystemId.Polygon,
    polygon,
  );
  const auroraBalances = useErc20BalancesQuery(EvmEcosystemId.Aurora, aurora);
  const fantomBalances = useErc20BalancesQuery(EvmEcosystemId.Fantom, fantom);
  const karuraBalances = useErc20BalancesQuery(EvmEcosystemId.Karura, karura);
  const acalaBalances = useErc20BalancesQuery(EvmEcosystemId.Acala, acala);

  return new Map(
    tokenSpecs.map((tokenSpec, i) => {
      switch (tokenSpec.nativeEcosystemId) {
        case SOLANA_ECOSYSTEM_ID: {
          const tokenAccount = solanaTokenAccounts[i];
          return [
            tokenSpec.id,
            tokenAccount
              ? Amount.fromAtomicBn(
                  tokenSpec,
                  tokenAccount.amount,
                  SOLANA_ECOSYSTEM_ID,
                )
              : null,
          ];
        }
        case EvmEcosystemId.Ethereum: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EvmEcosystemId.Ethereum,
            ethereumBalances,
            ethereum,
          );
        }
        case EvmEcosystemId.Bnb: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EvmEcosystemId.Bnb,
            bnbBalances,
            bnb,
          );
        }
        case EvmEcosystemId.Avalanche: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EvmEcosystemId.Avalanche,
            avalancheBalances,
            avalanche,
          );
        }
        case EvmEcosystemId.Polygon: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EvmEcosystemId.Polygon,
            polygonBalances,
            polygon,
          );
        }
        case EvmEcosystemId.Aurora: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EvmEcosystemId.Aurora,
            auroraBalances,
            aurora,
          );
        }
        case EvmEcosystemId.Fantom: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EvmEcosystemId.Fantom,
            fantomBalances,
            fantom,
          );
        }
        case EvmEcosystemId.Karura: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EvmEcosystemId.Karura,
            karuraBalances,
            karura,
          );
        }
        case EvmEcosystemId.Acala: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EvmEcosystemId.Acala,
            acalaBalances,
            acala,
          );
        }
        default:
          return [tokenSpec.id, null];
      }
    }),
  );
};
