import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { EvmEcosystemId } from "@swim-io/evm";
import type { TokenAccount } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";

import type { EcosystemId, TokenConfig } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";
import { Amount } from "../../models";
import { useErc20BalanceQuery } from "../evm";

export const useUserLpBalances = (
  lpTokenConfig: TokenConfig,
  userLpTokenAccountSolana: TokenAccount | null,
): Record<EcosystemId, Amount | null> => {
  // solana
  const userLpBalanceSolana = userLpTokenAccountSolana
    ? Amount.fromAtomicBn(
        lpTokenConfig,
        userLpTokenAccountSolana.amount,
        SOLANA_ECOSYSTEM_ID,
      )
    : null;

  // ethereum
  const ethereumTokenContractAddress =
    getTokenDetailsForEcosystem(lpTokenConfig, EvmEcosystemId.Ethereum)
      ?.address ?? null;
  const { data: userLpBalanceEthereumAtomic = null } = useErc20BalanceQuery(
    EvmEcosystemId.Ethereum,
    ethereumTokenContractAddress,
  );
  const userLpBalanceEthereum =
    ethereumTokenContractAddress && userLpBalanceEthereumAtomic
      ? Amount.fromAtomic(
          lpTokenConfig,
          userLpBalanceEthereumAtomic,
          EvmEcosystemId.Ethereum,
        )
      : null;

  // bnb
  const bnbTokenContractAddress =
    getTokenDetailsForEcosystem(lpTokenConfig, EvmEcosystemId.Bnb)?.address ??
    null;
  const { data: userLpBalanceBnbAtomic = null } = useErc20BalanceQuery(
    EvmEcosystemId.Bnb,
    bnbTokenContractAddress,
  );
  const userLpBalanceBnb =
    bnbTokenContractAddress && userLpBalanceBnbAtomic
      ? Amount.fromAtomic(
          lpTokenConfig,
          userLpBalanceBnbAtomic,
          EvmEcosystemId.Bnb,
        )
      : null;

  return {
    [APTOS_ECOSYSTEM_ID]: null,
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
