import { providers } from "ethers";

import { filterMap, isNotNull } from "../../utils";

const { JsonRpcProvider } = providers;

type TransactionResponse = providers.TransactionResponse;

const DEFAULT_RECENT_BLOCKS = 100;

export class LocalnetProvider extends JsonRpcProvider {
  async getHistory(
    address: string,
    startBlock?: number,
    endBlock?: number,
  ): Promise<readonly TransactionResponse[]> {
    const end = endBlock ?? (await this.getBlockNumber());
    const start = startBlock ?? end - DEFAULT_RECENT_BLOCKS;
    const blocksToFetch = [...new Array(end - start)].map((_, i) => end - i);
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
    return txs.filter((tx) =>
      [tx.from.toLowerCase(), tx.to?.toLowerCase()].includes(address),
    );
  }
}
