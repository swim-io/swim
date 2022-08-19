import type { Account as TokenAccount } from "@solana/spl-token";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";

import type { EcosystemId, TokenSpec } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";
import { Amount } from "../../models";
import { useErc20BalanceQuery } from "../evm";

export const useUserLpBalances = (
  lpTokenSpec: TokenSpec,
  userLpTokenAccountSolana: TokenAccount | null,
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
    getTokenDetailsForEcosystem(lpTokenSpec, EvmEcosystemId.Ethereum)
      ?.address ?? null;
  const { data: userLpBalanceEthereumAtomic = null } = useErc20BalanceQuery(
    EvmEcosystemId.Ethereum,
    ethereumTokenContractAddress,
  );
  const userLpBalanceEthereum =
    ethereumTokenContractAddress && userLpBalanceEthereumAtomic
      ? Amount.fromAtomic(
          lpTokenSpec,
          userLpBalanceEthereumAtomic,
          EvmEcosystemId.Ethereum,
        )
      : null;

  // bnb
  const bnbTokenContractAddress =
    getTokenDetailsForEcosystem(lpTokenSpec, EvmEcosystemId.Bnb)?.address ??
    null;
  const { data: userLpBalanceBnbAtomic = null } = useErc20BalanceQuery(
    EvmEcosystemId.Bnb,
    bnbTokenContractAddress,
  );
  const userLpBalanceBnb =
    bnbTokenContractAddress && userLpBalanceBnbAtomic
      ? Amount.fromAtomic(
          lpTokenSpec,
          userLpBalanceBnbAtomic,
          EvmEcosystemId.Bnb,
        )
      : null;

  return {
    [SOLANA_ECOSYSTEM_ID]: userLpBalanceSolana,
    [EvmEcosystemId.Ethereum]: userLpBalanceEthereum,
    [EvmEcosystemId.Bnb]: userLpBalanceBnb,
    [EvmEcosystemId.Avalanche]: null,
    [EvmEcosystemId.Polygon]: null,
    [EvmEcosystemId.Aurora]: null,
    [EvmEcosystemId.Fantom]: null,
    [EvmEcosystemId.Karura]: null,
    [EvmEcosystemId.Acala]: null,
  };
};
