import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID, findTokenAccountForMint } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";

import type { EcosystemId, TokenConfig } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";
import { Amount } from "../../models";
import { useAptosTokenBalancesQuery } from "../aptos";
import { useErc20BalancesQuery } from "../evm";
import { useSolanaWallet, useSplTokenAccountsQuery } from "../solana";

const getContractAddressesByEcosystem = (
  tokenConfigs: readonly TokenConfig[],
): ReadonlyRecord<EcosystemId, readonly string[]> =>
  tokenConfigs.reduce<ReadonlyRecord<EcosystemId, readonly string[]>>(
    (accumulator, tokenConfig) => {
      const [
        aptosAddress,
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
        APTOS_ECOSYSTEM_ID,
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
          getTokenDetailsForEcosystem(tokenConfig, ecosystemId)?.address ??
          null,
      );
      return {
        [APTOS_ECOSYSTEM_ID]: aptosAddress
          ? [...accumulator.aptos, aptosAddress]
          : accumulator.aptos,
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
      [APTOS_ECOSYSTEM_ID]: [],
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

const getTokenIdAndBalance = (
  tokenConfig: TokenConfig,
  ecosystemId: EcosystemId,
  balances: readonly UseQueryResult<Decimal | null, Error>[],
  contractAddresses: readonly string[],
): readonly [string, Amount | null] => {
  const address = getTokenDetailsForEcosystem(
    tokenConfig,
    ecosystemId,
  )?.address;
  if (!address) {
    return [tokenConfig.id, null];
  }
  const index = contractAddresses.findIndex(
    (contractAddress) => contractAddress === address,
  );
  if (!balances[index]) {
    return [tokenConfig.id, null];
  }
  const { data: balance = null } = balances[index];
  return [
    tokenConfig.id,
    balance !== null
      ? Amount.fromAtomic(tokenConfig, balance, ecosystemId)
      : null,
  ];
};

export const useMultipleUserBalances = (
  tokenConfigs: readonly TokenConfig[],
  specificEcosystem?: EcosystemId,
): ReadonlyMap<string, Amount | null> => {
  const {
    aptos,
    solana,
    ethereum,
    bnb,
    avalanche,
    polygon,
    aurora,
    fantom,
    karura,
    acala,
  } = getContractAddressesByEcosystem(tokenConfigs);
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
  const aptosBalances = useAptosTokenBalancesQuery(aptos);
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
    tokenConfigs.map((tokenConfig, i) => {
      const ecosystem = specificEcosystem ?? tokenConfig.nativeEcosystemId;
      switch (ecosystem) {
        case APTOS_ECOSYSTEM_ID: {
          return getTokenIdAndBalance(
            tokenConfig,
            APTOS_ECOSYSTEM_ID,
            aptosBalances,
            aptos,
          );
        }
        case SOLANA_ECOSYSTEM_ID: {
          const tokenAccount = solanaTokenAccounts[i];
          return [
            tokenConfig.id,
            tokenAccount
              ? Amount.fromAtomicBn(
                  tokenConfig,
                  tokenAccount.amount,
                  SOLANA_ECOSYSTEM_ID,
                )
              : null,
          ];
        }
        case EvmEcosystemId.Ethereum: {
          return getTokenIdAndBalance(
            tokenConfig,
            EvmEcosystemId.Ethereum,
            ethereumBalances,
            ethereum,
          );
        }
        case EvmEcosystemId.Bnb: {
          return getTokenIdAndBalance(
            tokenConfig,
            EvmEcosystemId.Bnb,
            bnbBalances,
            bnb,
          );
        }
        case EvmEcosystemId.Avalanche: {
          return getTokenIdAndBalance(
            tokenConfig,
            EvmEcosystemId.Avalanche,
            avalancheBalances,
            avalanche,
          );
        }
        case EvmEcosystemId.Polygon: {
          return getTokenIdAndBalance(
            tokenConfig,
            EvmEcosystemId.Polygon,
            polygonBalances,
            polygon,
          );
        }
        case EvmEcosystemId.Aurora: {
          return getTokenIdAndBalance(
            tokenConfig,
            EvmEcosystemId.Aurora,
            auroraBalances,
            aurora,
          );
        }
        case EvmEcosystemId.Fantom: {
          return getTokenIdAndBalance(
            tokenConfig,
            EvmEcosystemId.Fantom,
            fantomBalances,
            fantom,
          );
        }
        case EvmEcosystemId.Karura: {
          return getTokenIdAndBalance(
            tokenConfig,
            EvmEcosystemId.Karura,
            karuraBalances,
            karura,
          );
        }
        case EvmEcosystemId.Acala: {
          return getTokenIdAndBalance(
            tokenConfig,
            EvmEcosystemId.Acala,
            acalaBalances,
            acala,
          );
        }
        default:
          return [tokenConfig.id, null];
      }
    }),
  );
};
