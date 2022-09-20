import type { TokenAccount } from "@swim-io/solana";
import {
  SOLANA_ECOSYSTEM_ID,
  getAmountMintedToAccountByMint,
  getAmountTransferredToAccountByMint,
  isSolanaTx,
} from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import Decimal from "decimal.js";

import type { TokenConfig } from "../../config";
import { getSolanaTokenDetails } from "../../config";
import { Amount } from "../amount";
import type { Tx } from "../crossEcosystem";

export const getTransferredAmounts = (
  walletAddress: string,
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenConfig[],
  lpToken: TokenConfig,
  txs: readonly Tx[],
  // Record from token ID to Amount
): ReadonlyRecord<string, Amount | undefined> =>
  [lpToken, ...tokens].reduce<ReadonlyRecord<string, Amount | undefined>>(
    (accumulator, tokenConfig) => {
      const mint = getSolanaTokenDetails(tokenConfig).address;

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
        [tokenConfig.id]: Amount.fromAtomic(
          tokenConfig,
          amount,
          SOLANA_ECOSYSTEM_ID,
        ),
      };
    },
    {},
  );
