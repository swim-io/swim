import { providers } from "ethers";
import { gql, request } from "graphql-request";

type TransactionResponse = providers.TransactionResponse;
const JsonRpcProvider = providers.JsonRpcProvider;

const NUM_TX_TO_FETCH = 100;

// GraphQL Schema
interface TransactionReceipt {
  readonly transactionHash: string;
}

interface TransactionReceiptsConnection {
  readonly nodes: readonly TransactionReceipt[];
}

interface TransactionReceiptsResponse {
  readonly transactionReceipts: TransactionReceiptsConnection;
}

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

export class PolkadotProvider extends JsonRpcProvider {
  private readonly subqueryUrl: string;

  public constructor(ethRpcUrl: string, subqueryUrl: string) {
    super(ethRpcUrl);
    this.subqueryUrl = subqueryUrl;
  }

  public async getHistory(
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
      this.subqueryUrl,
      query,
    );
    const txResponses = Promise.all(
      queryRes.transactionReceipts.nodes.map(async (node) => {
        return this.getTransaction(node.transactionHash);
      }),
    );
    return txResponses;
  }
}
