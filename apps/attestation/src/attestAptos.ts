import type { ChainId } from "@certusone/wormhole-sdk";
import { CHAINS } from "@certusone/wormhole-sdk";
import type { AptosAccount, Types } from "aptos";
import { AptosClient } from "aptos";
import { ethers } from "ethers";
import { sha3_256 } from "js-sha3";

interface ICreateWrappedCoin {
  readonly sender: AptosAccount;
  readonly nodeUrl: string;
  readonly tokenChain: ChainId;
  readonly tokenAddress: string;
  readonly tokenBridgeAddress: string;
  readonly vaa: Uint8Array;
}

export const createWrappedCoin = async ({
  sender,
  nodeUrl,
  tokenChain,
  tokenAddress,
  tokenBridgeAddress,
  vaa,
}: ICreateWrappedCoin): Promise<string> => {
  console.info(`
  \n
  createWrappedCoin = async ({
    sender: ${sender.address().toString()},
    nodeUrl: ${nodeUrl},
    tokenChain: ${tokenChain},
    tokenAddress: ${tokenAddress},
    tokenBridgeAddress: ${tokenBridgeAddress},
    vaa: ${vaa.toString()},
  }
  \n
  `);
  const client = new AptosClientWrapper(nodeUrl);
  const createWrappedCoinTypePayload = {
    function: `${tokenBridgeAddress}::wrapped::create_wrapped_coin_type`,
    type_arguments: [],
    arguments: [vaa],
  };
  console.info("createWrappedCoinTypePayload", createWrappedCoinTypePayload);
  const assetType = getAssetFullyQualifiedType(
    tokenBridgeAddress,
    tokenChain,
    tokenAddress,
  );
  console.info("assetType (aptos address)", assetType);

  const createWrappedCoinPayload = {
    function: `${tokenBridgeAddress}::wrapped::create_wrapped_coin`,
    type_arguments: [assetType],
    arguments: [vaa],
  };
  console.info("createWrappedCoinPayload", createWrappedCoinPayload);

  // create coin type
  const createWrappedCoinTypeTx = await client.executeEntryFunction(
    sender,
    createWrappedCoinTypePayload,
  );
  console.info("createWrappedCoinTypeTx", createWrappedCoinTypeTx);

  // create coin
  return client.executeEntryFunction(sender, createWrappedCoinPayload);
};

const getAssetFullyQualifiedType = (
  tokenBridgeAddress: string, // 32 bytes
  originChain: ChainId,
  originAddress: string,
): string => {
  // native asset
  if (originChain === CHAINS.aptos) {
    // originAddress should be of form address::module::type
    if ((originAddress.match(/::/g) || []).length !== 2) {
      throw "Need fully qualified address for native asset";
    }

    return originAddress;
  }

  // non-native asset, derive unique address
  const chain: Buffer = Buffer.alloc(2);
  chain.writeUInt16BE(originChain);
  const wrappedAssetAddress = sha3_256(
    Buffer.concat([
      hex(tokenBridgeAddress),
      chain,
      Buffer.from("::", "ascii"),
      hex(originAddress),
    ]),
  );
  return `0x${wrappedAssetAddress}::coin::T`;
};

const hex = (x: string): Buffer => {
  return Buffer.from(
    ethers.utils.hexlify(x, { allowMissingPrefix: true }).substring(2),
    "hex",
  );
};

class AptosClientWrapper {
  private readonly client: AptosClient;

  public constructor(nodeUrl: string) {
    this.client = new AptosClient(nodeUrl);
  }

  public executeEntryFunction = async (
    sender: AptosAccount,
    payload: Types.EntryFunctionPayload,
    opts?: Partial<Types.SubmitTransactionRequest>,
  ): Promise<string> => {
    // overwriting `max_gas_amount` default
    // rest of defaults are defined here: https://aptos-labs.github.io/ts-sdk-doc/classes/AptosClient.html#generateTransaction
    const customOpts = Object.assign(
      {
        // max_gas_amount: "200000",
      },
      opts,
    );

    return (
      this.client
        // create raw transaction
        // TODO: compare `generateTransaction` flow with `generateBCSTransaction`
        .generateTransaction(sender.address(), payload, customOpts)
        // simulate transaction
        .then((rawTx) =>
          this.client
            .simulateTransaction(sender, rawTx)
            .then((sims) =>
              sims.forEach((tx) => {
                if (!tx.success) {
                  console.error(JSON.stringify(tx, null, 2));
                  throw new Error(
                    `Transaction simulation failed: ${tx.vm_status}`,
                  );
                }
              }),
            )
            .then(() => rawTx),
        )
        // sign & submit transaction if simulation is successful
        .then((rawTx) => this.client.signTransaction(sender, rawTx))
        .then((signedTx) => this.client.submitTransaction(signedTx))
        .then(async (pendingTx) => {
          await this.client.waitForTransaction(pendingTx.hash);
          return pendingTx.hash;
        })
    );
  };
}
