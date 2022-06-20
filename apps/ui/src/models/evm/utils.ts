import { INTERACTION_ID_LENGTH_HEX } from "../utils";

interface TransactionReceipt {
  readonly transactionHash: string;
}

interface TransactionReceiptsConnection {
  readonly nodes: readonly TransactionReceipt[];
}

export interface TransactionReceiptsResponse {
  readonly transactionReceipts: TransactionReceiptsConnection;
}

export const findEvmInteractionId = (
  data: string,
  recentInteractionIds: readonly string[],
): string | null => {
  const dataHex = data.replace(/^0x/, ""); // Remove 0x prefix

  if (dataHex.length < INTERACTION_ID_LENGTH_HEX) {
    return null;
  }

  const possibleInteractionId = dataHex.slice(-INTERACTION_ID_LENGTH_HEX);
  if (recentInteractionIds.includes(possibleInteractionId)) {
    return possibleInteractionId;
  }
  return null;
};
