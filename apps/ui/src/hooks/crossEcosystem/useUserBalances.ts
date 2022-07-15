import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import type Decimal from "decimal.js";

import type { EcosystemId, TokenSpec } from "../../config";
import { Amount } from "../../models";
import type { ReadonlyRecord } from "../../utils";
import { useErc20BalanceQuery } from "../evm/useErc20BalanceQuery";
import { useSplUserBalance } from "../solana";

export const useUserBalances = (
  tokenSpec: TokenSpec | null,
): ReadonlyRecord<EcosystemId, Decimal | null> => {
  // order of hooks can't change, so we pass in null values if we don't actually need the value
  const splBalance = useSplUserBalance(
    tokenSpec?.detailsByEcosystem.get(SOLANA_ECOSYSTEM_ID)?.address ?? null,
  );
  const { data: ethereumTokenBalance = null } = useErc20BalanceQuery(
    ETHEREUM_ECOSYSTEM_ID,
    tokenSpec?.detailsByEcosystem.get(ETHEREUM_ECOSYSTEM_ID)?.address ?? null,
  );
  const { data: bnbTokenBalance = null } = useErc20BalanceQuery(
    BNB_ECOSYSTEM_ID,
    tokenSpec?.detailsByEcosystem.get(BNB_ECOSYSTEM_ID)?.address ?? null,
  );
  // const { data: avalancheTokenBalance = null } = useErc20BalanceQuery(
  //   EcosystemId.Avalanche,
  //   tokenSpec?.detailsByEcosystem.get(EcosystemId.Avalanche)?.address ?? null,
  // );
  // const { data: polygonTokenBalance = null } = useErc20BalanceQuery(
  //   EcosystemId.Polygon,
  //   tokenSpec?.detailsByEcosystem.get(EcosystemId.Polygon)?.address ?? null,
  // );
  // const { data: auroraTokenBalance = null } = useErc20BalanceQuery(
  //   EcosystemId.Aurora,
  //   tokenSpec?.detailsByEcosystem.get(EcosystemId.Aurora)?.address ?? null,
  // );
  // const { data: fantomTokenBalance = null } = useErc20BalanceQuery(
  //   EcosystemId.Fantom,
  //   tokenSpec?.detailsByEcosystem.get(EcosystemId.Fantom)?.address ?? null,
  // );
  // const { data: karuraTokenBalance = null } = useErc20BalanceQuery(
  //   EcosystemId.Karura,
  //   tokenSpec?.detailsByEcosystem.get(EcosystemId.Karura)?.address ?? null,
  // );
  // const { data: acalaTokenBalance = null } = useErc20BalanceQuery(
  //   EcosystemId.Acala,
  //   tokenSpec?.detailsByEcosystem.get(EcosystemId.Acala)?.address ?? null,
  // );

  return {
    [SOLANA_ECOSYSTEM_ID]: splBalance,
    [ETHEREUM_ECOSYSTEM_ID]: ethereumTokenBalance,
    [BNB_ECOSYSTEM_ID]: bnbTokenBalance,
    // [EcosystemId.Avalanche]: avalancheTokenBalance,
    // [EcosystemId.Polygon]: polygonTokenBalance,
    // [EcosystemId.Aurora]: auroraTokenBalance,
    // [EcosystemId.Fantom]: fantomTokenBalance,
    // [EcosystemId.Karura]: karuraTokenBalance,
    // [EcosystemId.Acala]: acalaTokenBalance,
  };
};

export const useUserBalanceAmounts = (
  tokenSpec: TokenSpec | null,
): ReadonlyRecord<EcosystemId, Amount | null> => {
  const {
    solana: solanaBalance,
    ethereum: ethereumBalance,
    bnb: bnbBalance,
    // avalanche: avalancheBalance,
    // polygon: polygonBalance,
    // aurora: auroraBalance,
    // fantom: fantomBalance,
    // karura: karuraBalance,
    // acala: acalaBalance,
  } = useUserBalances(tokenSpec);

  const solanaAmount =
    solanaBalance && tokenSpec?.detailsByEcosystem.get(SOLANA_ECOSYSTEM_ID)
      ? Amount.fromAtomicString(
          tokenSpec,
          solanaBalance.toString(),
          SOLANA_ECOSYSTEM_ID,
        )
      : null;

  const ethereumAmount =
    ethereumBalance && tokenSpec?.detailsByEcosystem.get(ETHEREUM_ECOSYSTEM_ID)
      ? Amount.fromAtomicString(
          tokenSpec,
          ethereumBalance.toString(),
          ETHEREUM_ECOSYSTEM_ID,
        )
      : null;

  const bnbAmount =
    bnbBalance && tokenSpec?.detailsByEcosystem.get(BNB_ECOSYSTEM_ID)
      ? Amount.fromAtomicString(
          tokenSpec,
          bnbBalance.toString(),
          BNB_ECOSYSTEM_ID,
        )
      : null;

  // const avalancheAmount =
  //   avalancheBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Avalanche)
  //     ? Amount.fromAtomicString(
  //         tokenSpec,
  //         avalancheBalance.toString(),
  //         EcosystemId.Avalanche,
  //       )
  //     : null;

  // const polygonAmount =
  //   polygonBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Polygon)
  //     ? Amount.fromAtomicString(
  //         tokenSpec,
  //         polygonBalance.toString(),
  //         EcosystemId.Polygon,
  //       )
  //     : null;

  // const auroraAmount =
  //   auroraBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Aurora)
  //     ? Amount.fromAtomicString(
  //         tokenSpec,
  //         auroraBalance.toString(),
  //         EcosystemId.Aurora,
  //       )
  //     : null;

  // const fantomAmount =
  //   fantomBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Fantom)
  //     ? Amount.fromAtomicString(
  //         tokenSpec,
  //         fantomBalance.toString(),
  //         EcosystemId.Fantom,
  //       )
  //     : null;

  // const karuraAmount =
  //   karuraBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Karura)
  //     ? Amount.fromAtomicString(
  //         tokenSpec,
  //         karuraBalance.toString(),
  //         EcosystemId.Karura,
  //       )
  //     : null;

  // const acalaAmount =
  //   acalaBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Acala)
  //     ? Amount.fromAtomicString(
  //         tokenSpec,
  //         acalaBalance.toString(),
  //         EcosystemId.Acala,
  //       )
  //     : null;

  return {
    [SOLANA_ECOSYSTEM_ID]: solanaAmount,
    [ETHEREUM_ECOSYSTEM_ID]: ethereumAmount,
    [BNB_ECOSYSTEM_ID]: bnbAmount,
    // [EcosystemId.Avalanche]: avalancheAmount,
    // [EcosystemId.Polygon]: polygonAmount,
    // [EcosystemId.Aurora]: auroraAmount,
    // [EcosystemId.Fantom]: fantomAmount,
    // [EcosystemId.Karura]: karuraAmount,
    // [EcosystemId.Acala]: acalaAmount,
  };
};
