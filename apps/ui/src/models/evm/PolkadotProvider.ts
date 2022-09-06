import { Env } from "@swim-io/core/types";
import { ethers } from "ethers";
import { gql, request } from "graphql-request";

type TransactionResponse = ethers.providers.TransactionResponse;

const { JsonRpcProvider } = ethers.providers;
const NUM_TX_TO_FETCH = 100;

const KARURA_MAINNET_RPC_URL = process.env.REACT_APP_KARURA_MAINNET_RPC_URL;
const KARURA_MAINNET_SUBQL_URL = process.env.REACT_APP_KARURA_MAINNET_SUBQL_URL;

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

  constructor(ethRpcUrl: string, subqueryUrl: string) {
    super(ethRpcUrl);
    this.subqueryUrl = subqueryUrl;
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

export const getKaruraProvider = (env: Env): string => {
  switch (env) {
    case Env.Mainnet:
      if (KARURA_MAINNET_RPC_URL === undefined) {
        throw new Error("KARURA_MAINNET_RPC_URL is undefined");
      }
      return KARURA_MAINNET_RPC_URL;
    case Env.Devnet:
    default:
      throw new Error(
        `Karura provider (AcalaProvider) does not support ${env}`,
      );
  }
};

export const getKaruraSubQl = (env: Env): string => {
  switch (env) {
    case Env.Mainnet:
      if (KARURA_MAINNET_SUBQL_URL === undefined) {
        throw new Error("KARURA_MAINNET_SUBQL_URL is undefined");
      }
      return KARURA_MAINNET_SUBQL_URL;
    case Env.Devnet:
    default:
      throw new Error(`Karura SubQL does not support ${env}`);
  }
};
