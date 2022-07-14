import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";

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
        SOLANA_ECOSYSTEM_ID,
      )
    : null;

  // ethereum
  const ethereumTokenContractAddress =
    lpTokenSpec.detailsByEcosystem.get(ETHEREUM_ECOSYSTEM_ID)?.address ?? null;
  const { data: userLpBalanceEthereumAtomic = null } = useErc20BalanceQuery(
    ETHEREUM_ECOSYSTEM_ID,
    ethereumTokenContractAddress,
  );
  const userLpBalanceEthereum =
    ethereumTokenContractAddress && userLpBalanceEthereumAtomic
      ? Amount.fromAtomic(
          lpTokenSpec,
          userLpBalanceEthereumAtomic,
          ETHEREUM_ECOSYSTEM_ID,
        )
      : null;

  // bnb
  const bnbTokenContractAddress =
    lpTokenSpec.detailsByEcosystem.get(BNB_ECOSYSTEM_ID)?.address ?? null;
  const { data: userLpBalanceBnbAtomic = null } = useErc20BalanceQuery(
    BNB_ECOSYSTEM_ID,
    bnbTokenContractAddress,
  );
  const userLpBalanceBnb =
    bnbTokenContractAddress && userLpBalanceBnbAtomic
      ? Amount.fromAtomic(lpTokenSpec, userLpBalanceBnbAtomic, BNB_ECOSYSTEM_ID)
      : null;

  return {
    [SOLANA_ECOSYSTEM_ID]: userLpBalanceSolana,
    [ETHEREUM_ECOSYSTEM_ID]: userLpBalanceEthereum,
    [BNB_ECOSYSTEM_ID]: userLpBalanceBnb,
  };
};
