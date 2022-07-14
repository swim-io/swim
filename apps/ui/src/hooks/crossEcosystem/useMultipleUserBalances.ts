import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";

import type { TokenSpec } from "../../config";
import type { EcosystemId } from "../../config";
import { Amount, findTokenAccountForMint } from "../../models";
import type { ReadonlyRecord } from "../../utils";
import { useErc20BalancesQuery } from "../evm";
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
        avalancheAddress,
        polygonAddress,
        auroraAddress,
        fantomAddress,
        karuraAddress,
        acalaAddress,
      ] = [
        SOLANA_ECOSYSTEM_ID,
        ETHEREUM_ECOSYSTEM_ID,
        BNB_ECOSYSTEM_ID,
        EcosystemId.Avalanche,
        EcosystemId.Polygon,
        EcosystemId.Aurora,
        EcosystemId.Fantom,
        EcosystemId.Karura,
        EcosystemId.Acala,
      ].map(
        (ecosystemId) => detailsByEcosystem.get(ecosystemId)?.address ?? null,
      );
      return {
        [SOLANA_ECOSYSTEM_ID]: solanaAddress
          ? [...accumulator.solana, solanaAddress]
          : accumulator.solana,
        [ETHEREUM_ECOSYSTEM_ID]: ethereumAddress
          ? [...accumulator.ethereum, ethereumAddress]
          : accumulator.ethereum,
        [BNB_ECOSYSTEM_ID]: bnbAddress
          ? [...accumulator.bnb, bnbAddress]
          : accumulator.bnb,
        [EcosystemId.Avalanche]: avalancheAddress
          ? [...accumulator.avalanche, avalancheAddress]
          : accumulator.avalanche,
        [EcosystemId.Polygon]: polygonAddress
          ? [...accumulator.polygon, polygonAddress]
          : accumulator.polygon,
        [EcosystemId.Aurora]: auroraAddress
          ? [...accumulator.aurora, auroraAddress]
          : accumulator.aurora,
        [EcosystemId.Fantom]: fantomAddress
          ? [...accumulator.fantom, fantomAddress]
          : accumulator.fantom,
        [EcosystemId.Karura]: karuraAddress
          ? [...accumulator.karura, karuraAddress]
          : accumulator.karura,
        [EcosystemId.Acala]: acalaAddress
          ? [...accumulator.acala, acalaAddress]
          : accumulator.acala,
      };
    },
    {
      [SOLANA_ECOSYSTEM_ID]: [],
      [ETHEREUM_ECOSYSTEM_ID]: [],
      [BNB_ECOSYSTEM_ID]: [],
      [EcosystemId.Avalanche]: [],
      [EcosystemId.Polygon]: [],
      [EcosystemId.Aurora]: [],
      [EcosystemId.Fantom]: [],
      [EcosystemId.Karura]: [],
      [EcosystemId.Acala]: [],
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
    ETHEREUM_ECOSYSTEM_ID,
    ethereum,
  );
  const bnbBalances = useErc20BalancesQuery(BNB_ECOSYSTEM_ID, bnb);
  const avalancheBalances = useErc20BalancesQuery(
    EcosystemId.Avalanche,
    avalanche,
  );
  const polygonBalances = useErc20BalancesQuery(EcosystemId.Polygon, polygon);
  const auroraBalances = useErc20BalancesQuery(EcosystemId.Aurora, aurora);
  const fantomBalances = useErc20BalancesQuery(EcosystemId.Fantom, fantom);
  const karuraBalances = useErc20BalancesQuery(EcosystemId.Karura, karura);
  const acalaBalances = useErc20BalancesQuery(EcosystemId.Acala, acala);

  return new Map(
    tokenSpecs.map((tokenSpec, i) => {
      switch (tokenSpec.nativeEcosystem) {
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
        case ETHEREUM_ECOSYSTEM_ID: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            ETHEREUM_ECOSYSTEM_ID,
            ethereumBalances,
            ethereum,
          );
        }
        case BNB_ECOSYSTEM_ID: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            BNB_ECOSYSTEM_ID,
            bnbBalances,
            bnb,
          );
        }
        case EcosystemId.Avalanche: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EcosystemId.Avalanche,
            avalancheBalances,
            avalanche,
          );
        }
        case EcosystemId.Polygon: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EcosystemId.Polygon,
            polygonBalances,
            polygon,
          );
        }
        case EcosystemId.Aurora: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EcosystemId.Aurora,
            auroraBalances,
            aurora,
          );
        }
        case EcosystemId.Fantom: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EcosystemId.Fantom,
            fantomBalances,
            fantom,
          );
        }
        case EcosystemId.Karura: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EcosystemId.Karura,
            karuraBalances,
            karura,
          );
        }
        case EcosystemId.Acala: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EcosystemId.Acala,
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
