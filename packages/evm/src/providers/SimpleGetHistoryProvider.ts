import { filterMap, isNotNull } from "@swim-io/utils";
import { providers } from "ethers";

type TransactionResponse = providers.TransactionResponse;
const JsonRpcProvider = providers.JsonRpcProvider;

const DEFAULT_RECENT_BLOCKS = 100;

export class SimpleGetHistoryProvider extends JsonRpcProvider {
  public async getHistory(
    address: string,
    startBlock?: number,
    endBlock?: number,
  ): Promise<readonly TransactionResponse[]> {
    const end = endBlock ?? (await this.getBlockNumber());
    const start = startBlock ?? end - DEFAULT_RECENT_BLOCKS;
    const blocksToFetch = Array.from({ length: end - start }).map(
      (_, i) => end - i,
    );
    const blocks = await Promise.all(
      blocksToFetch.map((blockHeight) =>
        this.getBlockWithTransactions(blockHeight),
      ),
    );
    const txs = blocks.flatMap((block) =>
      // NOTE: ethers does not use strict mode so these txs can in rare cases be null
      filterMap(
        isNotNull,
        (tx) => ({
          ...tx,
          // NOTE: Ganache starts the blockchain at time 0 by default (ie beginning of Unix epoch) so this won’t be accurate
          timestamp: block.timestamp,
        }),
        block.transactions,
      ),
    );
    const lowerCaseAddress = address.toLowerCase();
    return txs.filter((tx) =>
      [tx.from.toLowerCase(), tx.to?.toLowerCase()].includes(lowerCaseAddress),
    );
  }
}
