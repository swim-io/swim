import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";

import type { TokenSpec } from "../../config";
import { EcosystemId } from "../../config";
import { Amount } from "../../models";
import { useErc20BalanceQuery } from "../evm";

export const useUserLpBalances = (
  lpTokenSpec: TokenSpec,
  userLpTokenAccountSolana: TokenAccountInfo | null,
): Record<EcosystemId, Amount | null> => {
  // solana
  const userLpBalanceSolana = userLpTokenAccountSolana
    ? Amount.fromAtomicBn(
        lpTokenSpec,
        userLpTokenAccountSolana.amount,
        EcosystemId.Solana,
      )
    : null;

  // ethereum
  const ethereumTokenContractAddress =
    lpTokenSpec.detailsByEcosystem.get(EcosystemId.Ethereum)?.address ?? null;
  const { data: userLpBalanceEthereumAtomic = null } = useErc20BalanceQuery(
    EcosystemId.Ethereum,
    ethereumTokenContractAddress,
  );
  const userLpBalanceEthereum =
    ethereumTokenContractAddress && userLpBalanceEthereumAtomic
      ? Amount.fromAtomic(
          lpTokenSpec,
          userLpBalanceEthereumAtomic,
          EcosystemId.Ethereum,
        )
      : null;

  // bsc
  const bscTokenContractAddress =
    lpTokenSpec.detailsByEcosystem.get(EcosystemId.Bsc)?.address ?? null;
  const { data: userLpBalanceBscAtomic = null } = useErc20BalanceQuery(
    EcosystemId.Bsc,
    bscTokenContractAddress,
  );
  const userLpBalanceBsc =
    bscTokenContractAddress && userLpBalanceBscAtomic
      ? Amount.fromAtomic(lpTokenSpec, userLpBalanceBscAtomic, EcosystemId.Bsc)
      : null;

  return {
    [EcosystemId.Solana]: userLpBalanceSolana,
    [EcosystemId.Ethereum]: userLpBalanceEthereum,
    [EcosystemId.Bsc]: userLpBalanceBsc,
    [EcosystemId.Avalanche]: null,
    [EcosystemId.Polygon]: null,
    [EcosystemId.Aurora]: null,
    [EcosystemId.Fantom]: null,
    [EcosystemId.Karura]: null,
    [EcosystemId.Acala]: null,
  };
};
