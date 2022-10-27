import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type Decimal from "decimal.js";

import type { EcosystemId, TokenConfig } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";
import { Amount } from "../../models";
import { useAptosTokenBalanceQuery } from "../aptos";
import { useErc20BalanceQuery } from "../evm";
import { useUserSolanaTokenBalance } from "../solana";

export const useUserBalance = (
  tokenConfig: TokenConfig | null,
  ecosystemId: EcosystemId,
): Decimal | null => {
  // order of hooks can't change, so we pass in null values if we don't actually need the value
  const { data: aptosTokenBalance = null } = useAptosTokenBalanceQuery(
    tokenConfig &&
      (getTokenDetailsForEcosystem(tokenConfig, APTOS_ECOSYSTEM_ID) ?? null),
    { enabled: ecosystemId === APTOS_ECOSYSTEM_ID },
  );
  const splBalance = useUserSolanaTokenBalance(
    tokenConfig &&
      (getTokenDetailsForEcosystem(tokenConfig, SOLANA_ECOSYSTEM_ID) ?? null),
    { enabled: ecosystemId === SOLANA_ECOSYSTEM_ID },
  );
  const { data: ethereumTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Ethereum,
    tokenConfig &&
      (getTokenDetailsForEcosystem(tokenConfig, EvmEcosystemId.Ethereum) ??
        null),
    { enabled: ecosystemId === EvmEcosystemId.Ethereum },
  );
  const { data: bnbTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Bnb,
    tokenConfig &&
      (getTokenDetailsForEcosystem(tokenConfig, EvmEcosystemId.Bnb) ?? null),
    { enabled: ecosystemId === EvmEcosystemId.Bnb },
  );
  const { data: avalancheTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Avalanche,
    tokenConfig &&
      (getTokenDetailsForEcosystem(tokenConfig, EvmEcosystemId.Avalanche) ??
        null),
    { enabled: ecosystemId === EvmEcosystemId.Avalanche },
  );
  const { data: polygonTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Polygon,
    tokenConfig &&
      (getTokenDetailsForEcosystem(tokenConfig, EvmEcosystemId.Polygon) ??
        null),
    { enabled: ecosystemId === EvmEcosystemId.Polygon },
  );
  const { data: auroraTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Aurora,
    tokenConfig &&
      (getTokenDetailsForEcosystem(tokenConfig, EvmEcosystemId.Aurora) ?? null),
    { enabled: ecosystemId === EvmEcosystemId.Aurora },
  );
  const { data: fantomTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Fantom,
    tokenConfig &&
      (getTokenDetailsForEcosystem(tokenConfig, EvmEcosystemId.Fantom) ?? null),
    { enabled: ecosystemId === EvmEcosystemId.Fantom },
  );
  const { data: karuraTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Karura,
    tokenConfig &&
      (getTokenDetailsForEcosystem(tokenConfig, EvmEcosystemId.Karura) ?? null),
    { enabled: ecosystemId === EvmEcosystemId.Karura },
  );
  const { data: acalaTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Acala,
    tokenConfig &&
      (getTokenDetailsForEcosystem(tokenConfig, EvmEcosystemId.Acala) ?? null),
    { enabled: ecosystemId === EvmEcosystemId.Acala },
  );

  return {
    [APTOS_ECOSYSTEM_ID]: aptosTokenBalance,
    [SOLANA_ECOSYSTEM_ID]: splBalance,
    [EvmEcosystemId.Ethereum]: ethereumTokenBalance,
    [EvmEcosystemId.Bnb]: bnbTokenBalance,
    [EvmEcosystemId.Avalanche]: avalancheTokenBalance,
    [EvmEcosystemId.Polygon]: polygonTokenBalance,
    [EvmEcosystemId.Aurora]: auroraTokenBalance,
    [EvmEcosystemId.Fantom]: fantomTokenBalance,
    [EvmEcosystemId.Karura]: karuraTokenBalance,
    [EvmEcosystemId.Acala]: acalaTokenBalance,
  }[ecosystemId];
};

export const useUserBalanceAmount = (
  tokenConfig: TokenConfig | null,
  ecosystemId: EcosystemId,
): Amount | null => {
  const balance = useUserBalance(tokenConfig, ecosystemId);

  return balance &&
    tokenConfig &&
    getTokenDetailsForEcosystem(tokenConfig, ecosystemId)
    ? Amount.fromHuman(tokenConfig, balance)
    : null;
};
