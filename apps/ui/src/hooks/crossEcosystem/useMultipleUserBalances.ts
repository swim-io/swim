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
      };
    },
    {
      [EcosystemId.Solana]: [],
      [EcosystemId.Ethereum]: [],
      [EcosystemId.Bsc]: [],
      [EcosystemId.Terra]: [],
      [EcosystemId.Avalanche]: [],
      [EcosystemId.Polygon]: [],
    },
  );

export const useMultipleUserBalances = (
  tokenSpecs: readonly TokenSpec[],
): ReadonlyMap<string, Amount | null> => {
  const { solana, ethereum, bsc } = getContractAddressesByEcosystem(tokenSpecs);
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
          if (!ethereumBalances[i]) {
            return [tokenSpec.id, null];
          }
          const { data: balance = null } = ethereumBalances[i];
          return [
            tokenSpec.id,
            balance !== null
              ? Amount.fromAtomic(tokenSpec, balance, EcosystemId.Ethereum)
              : null,
          ];
        }
        case EcosystemId.Bsc: {
          if (!bscBalances[i]) {
            return [tokenSpec.id, null];
          }
          const { data: balance = null } = bscBalances[i];
          return [
            tokenSpec.id,
            balance !== null
              ? Amount.fromAtomic(tokenSpec, balance, EcosystemId.Bsc)
              : null,
          ];
        }
        default:
          return [tokenSpec.id, null];
      }
    }),
  );
};
