import type Decimal from "decimal.js";

import type { TokenSpec } from "../../config";
import { EcosystemId, getTokenDetailsForEcosystem } from "../../config";
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
      (getTokenDetailsForEcosystem(tokenSpec, EcosystemId.Solana)?.address ??
        null),
    { enabled: ecosystemId === EcosystemId.Solana },
  );
  const { data: ethereumTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Ethereum,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EcosystemId.Ethereum)?.address ??
        null),
    { enabled: ecosystemId === EcosystemId.Ethereum },
  );
  const { data: bnbTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Bnb,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EcosystemId.Bnb)?.address ??
        null),
    { enabled: ecosystemId === EcosystemId.Bnb },
  );
  const { data: avalancheTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Avalanche,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EcosystemId.Avalanche)?.address ??
        null),
    { enabled: ecosystemId === EcosystemId.Avalanche },
  );
  const { data: polygonTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Polygon,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EcosystemId.Polygon)?.address ??
        null),
    { enabled: ecosystemId === EcosystemId.Polygon },
  );
  const { data: auroraTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Aurora,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EcosystemId.Aurora)?.address ??
        null),
    { enabled: ecosystemId === EcosystemId.Aurora },
  );
  const { data: fantomTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Fantom,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EcosystemId.Fantom)?.address ??
        null),
    { enabled: ecosystemId === EcosystemId.Fantom },
  );
  const { data: karuraTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Karura,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EcosystemId.Karura)?.address ??
        null),
    { enabled: ecosystemId === EcosystemId.Karura },
  );
  const { data: acalaTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Acala,
    tokenSpec &&
      (getTokenDetailsForEcosystem(tokenSpec, EcosystemId.Acala)?.address ??
        null),
    { enabled: ecosystemId === EcosystemId.Acala },
  );

  return {
    [EcosystemId.Solana]: splBalance,
    [EcosystemId.Ethereum]: ethereumTokenBalance,
    [EcosystemId.Bnb]: bnbTokenBalance,
    [EcosystemId.Avalanche]: avalancheTokenBalance,
    [EcosystemId.Polygon]: polygonTokenBalance,
    [EcosystemId.Aurora]: auroraTokenBalance,
    [EcosystemId.Fantom]: fantomTokenBalance,
    [EcosystemId.Karura]: karuraTokenBalance,
    [EcosystemId.Acala]: acalaTokenBalance,
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
