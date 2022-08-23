import type {
  BlockTag,
  TransactionReceipt,
} from "@ethersproject/abstract-provider";
import { Env } from "@swim-io/core";
import { BigNumber, ethers } from "ethers";
import { Moralis } from "moralis";

import { EvmChainId } from "../../config";

type TransactionResponse = ethers.providers.TransactionResponse;

export const { JsonRpcProvider } = ethers.providers;

const MORALIS_MAINNET_URL = process.env.REACT_APP_MORALIS_MAINNET_URL;
const MORALIS_TESTNET_URL = process.env.REACT_APP_MORALIS_TESTNET_URL;

// TODO: Reconsider variable names and file location.
const DISABLE_CHAIN_ID = 0;
// View "type" here for more detail: https://docs.ethers.io/v5/api/providers/types/#providers-TransactionRequest
const LEGACY_TX_TYPE = 0;
const MILLI_TO_MICRO = 0.001;
const DEFAULT_TIMEOUT_MS = 60 * 1000;
const NUM_TX_LIMIT = 100;

const getMoralisUrl = (env: Env): string => {
  switch (env) {
    case Env.Mainnet:
      if (MORALIS_MAINNET_URL === undefined) {
        throw new Error("MORALIS_MAINNET_URL is not set");
      }
      return MORALIS_MAINNET_URL;
    case Env.Devnet:
      if (MORALIS_TESTNET_URL === undefined) {
        throw new Error("MORALIS_TESTNET_URL is not set");
      }
      return MORALIS_TESTNET_URL;

    default:
      throw new Error(`${env} not supported by Moralis Provider`);
  }
};

// Implements getHistory() for JsonRpcProvider for BNB us Moralis, since other
// BNB ethers providers do not implement getHistory().
export class MoralisProvider extends JsonRpcProvider {
  private initialized: boolean;
  private readonly moralisChain: "bsc" | "bsc testnet";
  private readonly moralisUrl: string;
  private readonly moralisId: string;
  private readonly txTimeoutMs: number;

  constructor(
    env: Env,
    jsonRpcUrl: string,
    moralisId: string,
    txTimeoutMs = DEFAULT_TIMEOUT_MS,
  ) {
    const jsonRpcChainId =
      env === Env.Mainnet ? EvmChainId.BnbMainnet : EvmChainId.BnbTestnet;
    super(jsonRpcUrl, jsonRpcChainId);
    this.moralisChain = env === Env.Mainnet ? "bsc" : "bsc testnet";
    this.moralisUrl = getMoralisUrl(env);
    this.moralisId = moralisId;
    this.txTimeoutMs = txTimeoutMs;
    this.initialized = false;
  }

  async initialize(): Promise<void> {
    await Moralis.start({
      serverUrl: this.moralisUrl,
      appId: this.moralisId,
    });
    this.initialized = true;
  }

  async getHistory(
    addressOrName: string | Promise<string>,
    startBlock?: BlockTag,
    endBlock?: BlockTag,
  ): Promise<readonly TransactionResponse[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    const options = {
      chain: this.moralisChain,
      address:
        typeof addressOrName === "string" ? addressOrName : await addressOrName,
      order: "desc",
      from_block: this.blockTagToNumber(startBlock),
      to_block: this.blockTagToNumber(endBlock),
      limit: NUM_TX_LIMIT,
    };
    const moralisTxs: readonly Moralis.TransactionResult[] =
      (await Moralis.Web3API.account.getTransactions(options)).result ?? [];
    return moralisTxs.map((moralisTx) => {
      return this.toTxResponse(moralisTx);
    });
  }

  private toTxResponse(
    moralisTx: Moralis.TransactionResult,
  ): TransactionResponse {
    const waitFn = async (confirmations = 1): Promise<TransactionReceipt> => {
      return super.waitForTransaction(
        txResponse.hash,
        confirmations,
        this.txTimeoutMs,
      );
    };

    const txResponse: TransactionResponse = {
      blockHash: moralisTx.block_hash,
      blockNumber: Number(moralisTx.block_number),
      chainId: DISABLE_CHAIN_ID,
      // Note, confirmations is set to 0 since MoralisTransaction does not
      // export that data.
      confirmations: 0,
      data: moralisTx.input,
      from: moralisTx.from_address,
      gasLimit: BigNumber.from(moralisTx.gas),
      gasPrice: BigNumber.from(moralisTx.gas_price),
      hash: moralisTx.hash,
      nonce: Number(moralisTx.nonce),
      value: BigNumber.from(moralisTx.value),
      to: moralisTx.to_address,
      type: LEGACY_TX_TYPE,
      timestamp: Math.floor(
        new Date(moralisTx.block_timestamp).getTime() * MILLI_TO_MICRO,
      ),
      wait: waitFn,
    };
    return txResponse;
  }

  private blockTagToNumber(block: BlockTag | undefined): number | undefined {
    if (block === undefined) {
      return block;
    }
    return Number(block);
  }
}
