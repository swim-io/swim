import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { EvmEcosystemId } from "@swim-io/evm";
import type { TokenAccount } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";

import type { EcosystemId, TokenConfig } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";
import { Amount } from "../../models";
import { useAptosTokenBalanceQuery } from "../aptos";
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
  const ethereumTokenDetails =
    getTokenDetailsForEcosystem(lpTokenConfig, EvmEcosystemId.Ethereum) ?? null;
  const { data: userLpBalanceEthereumHuman = null } = useErc20BalanceQuery(
    EvmEcosystemId.Ethereum,
    ethereumTokenDetails,
  );
  const userLpBalanceEthereum =
    ethereumTokenDetails && userLpBalanceEthereumHuman
      ? Amount.fromHuman(lpTokenConfig, userLpBalanceEthereumHuman)
      : null;

  // bnb
  const bnbTokenDetails =
    getTokenDetailsForEcosystem(lpTokenConfig, EvmEcosystemId.Bnb) ?? null;
  const { data: userLpBalanceBnbHuman = null } = useErc20BalanceQuery(
    EvmEcosystemId.Bnb,
    bnbTokenDetails,
  );
  const userLpBalanceBnb =
    bnbTokenDetails && userLpBalanceBnbHuman
      ? Amount.fromHuman(lpTokenConfig, userLpBalanceBnbHuman)
      : null;

  // aptos
  const aptosTokenDetails =
    getTokenDetailsForEcosystem(lpTokenConfig, APTOS_ECOSYSTEM_ID) ?? null;
  const { data: userLpBalanceAptosHuman = null } = useAptosTokenBalanceQuery(
    aptosTokenDetails,
    { enabled: !!aptosTokenDetails },
  );
  const userLpBalanceAptos =
    aptosTokenDetails && userLpBalanceAptosHuman
      ? Amount.fromHuman(lpTokenConfig, userLpBalanceAptosHuman)
      : null;

  return {
    [APTOS_ECOSYSTEM_ID]: userLpBalanceAptos,
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
