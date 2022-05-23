import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";

import type { TokenSpec } from "../../config";
import { EcosystemId } from "../../config";
import { useSolanaWallet } from "../../contexts";
import { Amount, findTokenAccountForMint } from "../../models";
import type { ReadonlyRecord } from "../../utils";
import { useErc20BalancesQuery } from "../evm";
import { useSplTokenAccountsQuery } from "../solana";

const getContractAddressesByEcosystem = (
  tokenSpecs: readonly TokenSpec[],
): ReadonlyRecord<EcosystemId, readonly string[]> =>
  tokenSpecs.reduce<ReadonlyRecord<EcosystemId, readonly string[]>>(
    (accumulator, { detailsByEcosystem }) => {
      const [
        solanaAddress,
        ethereumAddress,
        bscAddress,
        avalancheAddress,
        polygonAddress,
      ] = [
        EcosystemId.Solana,
        EcosystemId.Ethereum,
        EcosystemId.Bsc,
        EcosystemId.Avalanche,
        EcosystemId.Polygon,
        // TODO: Add support for Aurora/Fantom/Acala
      ].map(
        (ecosystemId) => detailsByEcosystem.get(ecosystemId)?.address ?? null,
      );
      return {
        [EcosystemId.Solana]: solanaAddress
          ? [...accumulator.solana, solanaAddress]
          : accumulator.solana,
        [EcosystemId.Ethereum]: ethereumAddress
          ? [...accumulator.ethereum, ethereumAddress]
          : accumulator.ethereum,
        [EcosystemId.Bsc]: bscAddress
          ? [...accumulator.bsc, bscAddress]
          : accumulator.bsc,
        [EcosystemId.Terra]: [],
        [EcosystemId.Avalanche]: avalancheAddress
          ? [...accumulator.avalanche, avalancheAddress]
          : accumulator.avalanche,
        [EcosystemId.Polygon]: polygonAddress
          ? [...accumulator.polygon, polygonAddress]
          : accumulator.polygon,
        [EcosystemId.Aurora]: [],
        [EcosystemId.Fantom]: [],
        [EcosystemId.Acala]: [],
      };
    },
    {
      [EcosystemId.Solana]: [],
      [EcosystemId.Ethereum]: [],
      [EcosystemId.Bsc]: [],
      [EcosystemId.Terra]: [],
      [EcosystemId.Avalanche]: [],
      [EcosystemId.Polygon]: [],
      [EcosystemId.Aurora]: [],
      [EcosystemId.Fantom]: [],
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
  const { solana, ethereum, bsc, avalanche, polygon } =
    getContractAddressesByEcosystem(tokenSpecs);
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
    EcosystemId.Ethereum,
    ethereum,
  );
  const bscBalances = useErc20BalancesQuery(EcosystemId.Bsc, bsc);
  const avalancheBalances = useErc20BalancesQuery(
    EcosystemId.Avalanche,
    avalanche,
  );
  const polygonBalances = useErc20BalancesQuery(EcosystemId.Polygon, polygon);

  return new Map(
    tokenSpecs.map((tokenSpec, i) => {
      switch (tokenSpec.nativeEcosystem) {
        case EcosystemId.Solana: {
          const tokenAccount = solanaTokenAccounts[i];
          return [
            tokenSpec.id,
            tokenAccount
              ? Amount.fromAtomicBn(
                  tokenSpec,
                  tokenAccount.amount,
                  EcosystemId.Solana,
                )
              : null,
          ];
        }
        case EcosystemId.Ethereum: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EcosystemId.Ethereum,
            ethereumBalances,
            ethereum,
          );
        }
        case EcosystemId.Bsc: {
          return getEvmTokenIdAndBalance(
            tokenSpec,
            EcosystemId.Bsc,
            bscBalances,
            bsc,
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
        default:
          return [tokenSpec.id, null];
      }
    }),
  );
};
