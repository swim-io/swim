import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";

import type { TokenSpec } from "../../config";
import { EcosystemId, getTokenDetailsForEcosystem } from "../../config";
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
    getTokenDetailsForEcosystem(lpTokenSpec, EcosystemId.Ethereum)?.address ??
    null;
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

  // bnb
  const bnbTokenContractAddress =
    getTokenDetailsForEcosystem(lpTokenSpec, EcosystemId.Bnb)?.address ?? null;
  const { data: userLpBalanceBnbAtomic = null } = useErc20BalanceQuery(
    EcosystemId.Bnb,
    bnbTokenContractAddress,
  );
  const userLpBalanceBnb =
    bnbTokenContractAddress && userLpBalanceBnbAtomic
      ? Amount.fromAtomic(lpTokenSpec, userLpBalanceBnbAtomic, EcosystemId.Bnb)
      : null;

  return {
    [EcosystemId.Solana]: userLpBalanceSolana,
    [EcosystemId.Ethereum]: userLpBalanceEthereum,
    [EcosystemId.Bnb]: userLpBalanceBnb,
    [EcosystemId.Avalanche]: null,
    [EcosystemId.Polygon]: null,
    [EcosystemId.Aurora]: null,
    [EcosystemId.Fantom]: null,
    [EcosystemId.Karura]: null,
    [EcosystemId.Acala]: null,
  };
};
