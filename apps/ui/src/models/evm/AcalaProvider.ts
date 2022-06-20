import { ethers } from "ethers";
import { gql, request } from "graphql-request";

import type { TransactionReceiptsResponse } from "./utils";

type TransactionResponse = ethers.providers.TransactionResponse;

const { JsonRpcProvider } = ethers.providers;
const NUM_TX_TO_FETCH = 100;

const createQuery = (
  numTxs: number,
  start: number,
  end: number,
  fromAddress: string,
): string => {
  return gql`
  query {
    transactionReceipts(
      first: ${numTxs},
      filter: {
        from: {
          equalTo: "${fromAddress}"
        },
        blockNumber: {
          greaterThan: "${start}"
          lessThan: "${end}"
        }
      }
    ) {
      nodes {
        transactionHash
      }
    }
  }
  `;
};

// This also supports Karura.
export class AcalaProvider extends JsonRpcProvider {
  private readonly subqlUrl: string;

  constructor(ethRpcUrl: string, subqlUrl: string) {
    super(ethRpcUrl);
    this.subqlUrl = subqlUrl;
  }

  async getHistory(
    addressOrName: string,
    startBlock?: number,
    endBlock?: number,
  ): Promise<readonly TransactionResponse[]> {
    const query = createQuery(
      NUM_TX_TO_FETCH,
      startBlock ?? 0,
      endBlock ?? 99999999,
      addressOrName,
    );
    const queryRes = await request<TransactionReceiptsResponse>(
      this.subqlUrl,
      query,
    );
    const txResponses = Promise.all(
      queryRes.transactionReceipts.nodes.map(async (node) => {
        return await this.getTransaction(node.transactionHash);
      }),
    );
    return txResponses;
  }
}
