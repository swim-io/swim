import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type { Keypair } from "@solana/web3.js";

import type { TokenSpec, WormholeChainSpec } from "../../config";
import { EcosystemId, getSolanaTokenDetails } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { isNotNull } from "../../utils";
import type { Amount } from "../amount";
import type { Tx, TxsByTokenId } from "../crossEcosystem";
import { isEvmTx, isSolanaTx } from "../crossEcosystem";
import { isRedeemOnSolanaTx, isUnlockEvmTx } from "../wormhole";

/**
 * This represents a planned cross-chain transfer for which the amount is currently unknown, for example because it depends on the result of a pool interaction.
 */
export interface ProtoTransfer {
  readonly interactionId: string;
  readonly token: TokenSpec;
  readonly fromEcosystem: EcosystemId;
  readonly toEcosystem: EcosystemId;
  readonly amount: null;
  readonly isComplete: boolean;
}

export interface Transfer extends Omit<ProtoTransfer, "amount"> {
  readonly amount: Amount;
}

export interface ProtoTransferToSolana extends ProtoTransfer {
  readonly signatureSetKeypair: Keypair;
}

export interface TransferToSolana
  extends Omit<ProtoTransferToSolana, "amount">,
    Transfer {}

export interface TransfersWithExistingTxs {
  readonly transfers: readonly Transfer[];
  readonly existingTxs: TxsByTokenId;
}

export interface TransfersToSolanaWithExistingTxs {
  readonly transfers: readonly TransferToSolana[];
  readonly existingTxs: TxsByTokenId;
}

export enum TransferType {
  LpToken,
  Tokens,
}

export type Transfers<T extends Transfer | ProtoTransfer> =
  | {
      readonly type: TransferType.LpToken;
      readonly lpToken: T | null;
    }
  | {
      readonly type: TransferType.Tokens;
      readonly tokens: readonly (T | null)[];
    };

export const combineTransfers = <T extends Transfer | ProtoTransfer>(
  transfers: Transfers<T>,
): readonly T[] => {
  switch (transfers.type) {
    case TransferType.LpToken:
      return transfers.lpToken ? [transfers.lpToken] : [];
    case TransferType.Tokens:
      return transfers.tokens.filter(isNotNull);
    default:
      throw new Error("Unknown transfer type");
  }
};

export const generateInputTransfers = (
  interactionId: string,
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  amounts: readonly Amount[],
  signatureSetKeypairs: ReadonlyRecord<string, Keypair | undefined>,
): readonly (TransferToSolana | null)[] =>
  tokens.map((token, i) => {
    if (token.nativeEcosystem === EcosystemId.Solana) {
      return null;
    }
    if (amounts.length === 0) {
      return null;
    }
    const amount = amounts[i];
    if (amount.isNegative() || amount.isZero()) {
      return null;
    }
    const solanaDetails = getSolanaTokenDetails(token);
    const splTokenAccount =
      splTokenAccounts.find(
        (account) => account.mint.toBase58() === solanaDetails.address,
      ) ?? null;
    const signatureSetKeypair = signatureSetKeypairs[token.id];
    console.log(
      "keys",
      signatureSetKeypairs,
      "key",
      signatureSetKeypair,
      "token",
      token,
    );
    if (signatureSetKeypair === undefined) {
      throw new Error("Missing signature set key pair");
    }
    return {
      interactionId,
      token,
      amount: amounts[i],
      splTokenAccountAddress: splTokenAccount?.address.toBase58() ?? null,
      fromEcosystem: token.nativeEcosystem,
      toEcosystem: EcosystemId.Solana,
      signatureSetKeypair,
      isComplete: false,
    };
  });

export const generateOutputProtoTransfers = (
  interactionId: string,
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
): readonly (ProtoTransfer | null)[] =>
  tokens.map((token) => {
    if (token.nativeEcosystem === EcosystemId.Solana) {
      return null;
    }
    const solanaDetails = getSolanaTokenDetails(token);
    const splTokenAccount =
      splTokenAccounts.find(
        (account) => account.mint.toBase58() === solanaDetails.address,
      ) ?? null;
    return {
      interactionId,
      token,
      splTokenAccountAddress: splTokenAccount?.address.toBase58() ?? null,
      fromEcosystem: EcosystemId.Solana,
      toEcosystem: token.nativeEcosystem,
      amount: null,
      isComplete: false,
    };
  });

export const generateOutputTransfers = (
  interactionId: string,
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  amounts: readonly Amount[],
): readonly (Transfer | null)[] =>
  tokens.map((token, i) => {
    if (token.nativeEcosystem === EcosystemId.Solana) {
      return null;
    }
    if (amounts.length === 0) {
      return null;
    }
    const amount = amounts[i];
    if (amount.isNegative() || amount.isZero()) {
      return null;
    }
    const solanaDetails = getSolanaTokenDetails(token);
    const splTokenAccount =
      splTokenAccounts.find(
        (account) => account.mint.toBase58() === solanaDetails.address,
      ) ?? null;
    return {
      interactionId,
      token,
      amount: amount,
      splTokenAccountAddress: splTokenAccount?.address.toBase58() ?? null,
      fromEcosystem: EcosystemId.Solana,
      toEcosystem: token.nativeEcosystem,
      isComplete: false,
    };
  });

export const generateSingleOutputProtoTransfers = (
  interactionId: string,
  tokens: readonly TokenSpec[],
  outputTokenIndex: number,
): readonly (ProtoTransfer | null)[] =>
  tokens.map((token, i) => {
    if (
      i !== outputTokenIndex ||
      token.nativeEcosystem === EcosystemId.Solana
    ) {
      return null;
    }
    return {
      interactionId,
      token: token,
      fromEcosystem: EcosystemId.Solana,
      toEcosystem: token.nativeEcosystem,
      amount: null,
      isComplete: false,
    };
  });

export const generateLpInTransfer = (
  interactionId: string,
  lpToken: TokenSpec,
  amount: Amount,
  lpTokenSourceEcosystem: EcosystemId,
  signatureSetKeypairs: ReadonlyRecord<string, Keypair | undefined>,
): TransferToSolana | null => {
  if (lpTokenSourceEcosystem === EcosystemId.Solana) {
    return null;
  }
  const signatureSetKeypair = signatureSetKeypairs[lpToken.id];
  if (signatureSetKeypair === undefined) {
    throw new Error("Missing signature set key pair");
  }
  return {
    interactionId,
    token: lpToken,
    amount,
    fromEcosystem: lpTokenSourceEcosystem,
    toEcosystem: EcosystemId.Solana,
    signatureSetKeypair,
    isComplete: false,
  };
};

export const generateLpOutProtoTransfer = (
  interactionId: string,
  lpToken: TokenSpec,
  lpTokenTargetEcosystem: EcosystemId,
): ProtoTransfer | null => {
  if (lpTokenTargetEcosystem === EcosystemId.Solana) {
    return null;
  }
  return {
    interactionId,
    token: lpToken,
    fromEcosystem: EcosystemId.Solana,
    toEcosystem: lpTokenTargetEcosystem,
    amount: null,
    isComplete: false,
  };
};

export const didTransferToSolanaComplete = (
  solanaWormhole: WormholeChainSpec,
  splTokenAccount: TokenAccount | null,
  { amount, token }: Transfer,
  txs: readonly Tx[] | null,
): boolean => {
  if (amount.isZero()) {
    return true;
  }
  if (splTokenAccount === null || txs === null) {
    return false;
  }
  return txs.some(
    (tx) =>
      isSolanaTx(tx) &&
      isRedeemOnSolanaTx(
        solanaWormhole,
        token,
        splTokenAccount.address.toBase58(),
        tx,
      ),
  );
};

export const didTransferFromSolanaComplete = (
  evmWormhole: WormholeChainSpec,
  { amount, token }: Transfer,
  txs: readonly Tx[] | null,
): boolean => {
  if (amount.isZero()) {
    return true;
  }
  if (txs === null) {
    return false;
  }

  return txs.some((tx) => isEvmTx(tx) && isUnlockEvmTx(evmWormhole, token, tx));
};

export const didAllTransfersComplete = <T extends Transfer>(
  transfers: Transfers<T>,
): boolean => {
  switch (transfers.type) {
    case TransferType.LpToken:
      return transfers.lpToken === null || transfers.lpToken.isComplete;
    case TransferType.Tokens:
      return transfers.tokens.every(
        (transfer) => transfer === null || transfer.isComplete,
      );
    default:
      throw new Error("Unknown transfers type");
  }
};

export const updateTransfersWithNewSignatureSetKeypairs = (
  transfers: Transfers<TransferToSolana>,
  signatureSetKeypairs: ReadonlyRecord<string, Keypair | undefined>,
): Transfers<TransferToSolana> => {
  switch (transfers.type) {
    case TransferType.LpToken: {
      const { lpToken } = transfers;
      return lpToken === null
        ? transfers
        : {
            ...transfers,
            lpToken: {
              ...lpToken,
              signatureSetKeypair:
                signatureSetKeypairs[lpToken.token.id] ??
                lpToken.signatureSetKeypair,
            },
          };
    }
    case TransferType.Tokens: {
      const { tokens } = transfers;
      return {
        ...transfers,
        tokens: tokens.map((transfer) =>
          transfer === null
            ? transfer
            : {
                ...transfer,
                signatureSetKeypair:
                  signatureSetKeypairs[transfer.token.id] ??
                  transfer.signatureSetKeypair,
              },
        ),
      };
    }
    default:
      throw new Error("Invalid transfers type");
  }
};
