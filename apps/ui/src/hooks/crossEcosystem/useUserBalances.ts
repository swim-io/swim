import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type Decimal from "decimal.js";

import type { EcosystemId, TokenSpec } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";
import { Amount } from "../../models";
import { useErc20BalanceQuery } from "../evm";
import { useSplUserBalance } from "../solana";

const useUserBalance = (
  tokenSpec: TokenSpec | null,
  ecosystemId: EcosystemId,
): Decimal | null => {
  // order of hooks can't change, so we pass in null values if we don't actually need the value
  const splBalance = useSplUserBalance(
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, SOLANA_ECOSYSTEM_ID)?.address ??
        null),
    { enabled: ecosystemId === SOLANA_ECOSYSTEM_ID },
  );
  const { data: ethereumTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Ethereum,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EvmEcosystemId.Ethereum)
        ?.address ??
        null),
    { enabled: ecosystemId === EvmEcosystemId.Ethereum },
  );
  const { data: bnbTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Bnb,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EvmEcosystemId.Bnb)?.address ??
        null),
    { enabled: ecosystemId === EvmEcosystemId.Bnb },
  );
  const { data: avalancheTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Avalanche,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EvmEcosystemId.Avalanche)
        ?.address ??
        null),
    { enabled: ecosystemId === EvmEcosystemId.Avalanche },
  );
  const { data: polygonTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Polygon,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EvmEcosystemId.Polygon)
        ?.address ??
        null),
    { enabled: ecosystemId === EvmEcosystemId.Polygon },
  );
  const { data: auroraTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Aurora,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EvmEcosystemId.Aurora)?.address ??
        null),
    { enabled: ecosystemId === EvmEcosystemId.Aurora },
  );
  const { data: fantomTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Fantom,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EvmEcosystemId.Fantom)?.address ??
        null),
    { enabled: ecosystemId === EvmEcosystemId.Fantom },
  );
  const { data: karuraTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Karura,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EvmEcosystemId.Karura)?.address ??
        null),
    { enabled: ecosystemId === EvmEcosystemId.Karura },
  );
  const { data: acalaTokenBalance = null } = useErc20BalanceQuery(
    EvmEcosystemId.Acala,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EvmEcosystemId.Acala)?.address ??
        null),
    { enabled: ecosystemId === EvmEcosystemId.Acala },
  );

  return {
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
  tokenSpec: TokenSpec | null,
  ecosystemId: EcosystemId,
): Amount | null => {
  const balance = useUserBalance(tokenSpec, ecosystemId);

  return balance &&
    tokenSpec &&
    getTokenDetailsForEcosystem(tokenSpec, ecosystemId)
    ? Amount.fromAtomicString(tokenSpec, balance.toString(), ecosystemId)
    : null;
};
