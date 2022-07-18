import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";

import type { EcosystemId, TokenSpec } from "../../config";
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
        "solana",
      )
    : null;

  // ethereum
  const ethereumTokenContractAddress =
    lpTokenSpec.detailsByEcosystem.get("ethereum")?.address ?? null;
  const { data: userLpBalanceEthereumAtomic = null } = useErc20BalanceQuery(
    "ethereum",
    ethereumTokenContractAddress,
  );
  const userLpBalanceEthereum =
    ethereumTokenContractAddress && userLpBalanceEthereumAtomic
      ? Amount.fromAtomic(lpTokenSpec, userLpBalanceEthereumAtomic, "ethereum")
      : null;

  // bnb
  const bnbTokenContractAddress =
    lpTokenSpec.detailsByEcosystem.get("bnb")?.address ?? null;
  const { data: userLpBalanceBnbAtomic = null } = useErc20BalanceQuery(
    "bnb",
    bnbTokenContractAddress,
  );
  const userLpBalanceBnb =
    bnbTokenContractAddress && userLpBalanceBnbAtomic
      ? Amount.fromAtomic(lpTokenSpec, userLpBalanceBnbAtomic, "bnb")
      : null;

  return {
    solana: userLpBalanceSolana,
    ethereum: userLpBalanceEthereum,
    bnb: userLpBalanceBnb,
  };
};
