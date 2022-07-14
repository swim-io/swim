import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import Decimal from "decimal.js";

import type { TokenSpec } from "../../config";
import { getSolanaTokenDetails } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { Amount } from "../amount";
import type { Tx } from "../crossEcosystem";
import { isSolanaTx } from "../crossEcosystem";
import {
  getAmountMintedToAccountByMint,
  getAmountTransferredToAccountByMint,
} from "../solana";

export const getTransferredAmounts = (
  walletAddress: string,
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  txs: readonly Tx[],
  // Record from token ID to Amount
): ReadonlyRecord<string, Amount | undefined> =>
  [lpToken, ...tokens].reduce<ReadonlyRecord<string, Amount | undefined>>(
    (accumulator, tokenSpec) => {
      const mint = getSolanaTokenDetails(tokenSpec).address;

      let amount = new Decimal(0);
      for (const tx of txs) {
        if (!isSolanaTx(tx)) {
          continue;
        }
        // Solana-native token
        amount = getAmountTransferredToAccountByMint(
          splTokenAccounts,
          tx.parsedTx,
          mint,
          walletAddress,
        );
        if (!amount.isZero()) {
          break;
        }
        // Wormhole-wrapped token
        amount = getAmountMintedToAccountByMint(
          splTokenAccounts,
          tx.parsedTx,
          mint,
          walletAddress,
        );
        if (!amount.isZero()) {
          break;
        }
      }

      return {
        ...accumulator,
        [tokenSpec.id]: Amount.fromAtomic(
          tokenSpec,
          amount,
          SOLANA_ECOSYSTEM_ID,
        ),
      };
    },
    {},
  );
