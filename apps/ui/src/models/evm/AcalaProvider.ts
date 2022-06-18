import { SubqlProvider } from "@acala-network/eth-providers/lib/utils/subqlProvider";
import { ethers } from "ethers";

type TransactionResponse = ethers.providers.TransactionResponse;

const { JsonRpcProvider } = ethers.providers;

const createQuery = (
  numTxs: number,
  start: number,
  end: number,
  fromAddress: string,
): string => {
  return `
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
  private readonly subqlProvider: SubqlProvider;

  constructor(ethRpcUrl: string, subqlUrl: string) {
    super(ethRpcUrl);
    this.subqlProvider = new SubqlProvider(subqlUrl);
  }

  async getHistory(
    addressOrName: string,
    startBlock?: number,
    endBlock?: number,
  ): Promise<readonly TransactionResponse[]> {
    const query = createQuery(
      100,
      startBlock ?? 0,
      endBlock ?? 99999999,
      addressOrName,
    );
    const queryRes = await this.subqlProvider.queryGraphql(query);
    if (!queryRes.transactionReceipts) {
      return [];
    }
    const txResponses = Promise.all(
      queryRes.transactionReceipts.nodes.map(async (node) => {
        if (!node) {
          throw new Error(`Malformed graphQl query: ${query}`);
        }
        const x = await this.getTransaction(node.transactionHash);
        return x;
      }),
    );
    return txResponses;
  }
}
