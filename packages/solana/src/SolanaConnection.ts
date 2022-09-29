import {
  createPostVaaInstructionSolana,
  createVerifySignaturesInstructionsSolana,
} from "@certusone/wormhole-sdk";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import type {
  Commitment,
  Finality,
  ParsedTransactionWithMeta,
  RpcResponseAndContext,
  SignatureResult,
  Transaction,
  TransactionInstruction,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import type { WormholeChainConfig } from "@swim-io/core";
import { chunks, sleep } from "@swim-io/utils";

import type { TokenAccount } from "./serialization/tokenAccount";
import { deserializeTokenAccount } from "./serialization/tokenAccount";
import { createMemoIx, createTx } from "./utils";
import type { SolanaWalletAdapter } from "./walletAdapters";
import { createRedeemOnSolanaTx } from "./wormhole";

export const DEFAULT_MAX_RETRIES = 10;
export const DEFAULT_COMMITMENT_LEVEL: Finality = "confirmed";
const DEFAULT_SLEEP_MS = 1000;

export interface GenerateUnlockSplTokenTxIdsParams {
  readonly interactionId: string;
  readonly solanaWormhole: WormholeChainConfig;
  readonly solanaWallet: SolanaWalletAdapter;
  readonly vaaKeypair: Keypair;
  readonly vaaBytes: Uint8Array;
}

export interface GetSolanaTransactionOptions {
  readonly maxRetries?: number;
  readonly commitmentLevel?: Finality;
}

export class CustomConnection extends Connection {
  // re-declare so we can use it here
  private readonly _rpcWebSocketHeartbeat: ReturnType<
    typeof setInterval
  > | null = null;

  private _wsOnOpen(): void {
    // @ts-expect-error Solana marked most of their methods as internal
    super._wsOnOpen();

    // Prevent the 5s pings since they are not supported by the WS server and eat up rate limits
    if (this._rpcWebSocketHeartbeat !== null) {
      clearInterval(this._rpcWebSocketHeartbeat);
    }
  }
}

/**
 * A wrapper class around Connection from @solana/web3.js
 * We want to use this for eg getting txs
 */
export class SolanaConnection {
  public getAccountInfo!: InstanceType<typeof Connection>["getAccountInfo"];
  public getBalance!: InstanceType<typeof Connection>["getBalance"];
  public getMinimumBalanceForRentExemption!: InstanceType<
    typeof Connection
  >["getMinimumBalanceForRentExemption"];
  public getLatestBlockhash!: InstanceType<
    typeof Connection
  >["getLatestBlockhash"];
  public getSignaturesForAddress!: InstanceType<
    typeof Connection
  >["getSignaturesForAddress"];
  public getTokenAccountsByOwner!: InstanceType<
    typeof Connection
  >["getTokenAccountsByOwner"];
  public onAccountChange!: InstanceType<typeof Connection>["onAccountChange"];
  public removeAccountChangeListener!: InstanceType<
    typeof Connection
  >["removeAccountChangeListener"];

  public rawConnection!: CustomConnection;
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly txCache: Map<string, VersionedTransactionResponse>;
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly parsedTxCache: Map<string, ParsedTransactionWithMeta>;
  private rpcIndex;
  private readonly endpoints: readonly string[];
  // TODO: Check if this is still necessary.
  // The websocket library solana/web3.js closes its websocket connection when the subscription list
  // is empty after opening its first time, preventing subsequent subscriptions from receiving responses.
  // This is a hack to prevent the list from ever getting empty
  private dummySubscriptionId!: number;

  public constructor(endpoints: readonly string[]) {
    this.endpoints = endpoints;
    this.rpcIndex = -1;
    this.incrementRpcProvider();

    // NOTE: This design assumes no tx ID collisions between different environments eg Mainnet-beta and devnet.
    this.txCache = new Map<string, VersionedTransactionResponse>();
    this.parsedTxCache = new Map<string, ParsedTransactionWithMeta>();
  }

  public async *generateUnlockSplTokenTxIds({
    interactionId,
    solanaWormhole,
    solanaWallet,
    vaaKeypair,
    vaaBytes,
  }: GenerateUnlockSplTokenTxIdsParams): AsyncGenerator<string> {
    const { publicKey: solanaPublicKey } = solanaWallet;
    if (!solanaPublicKey) {
      throw new Error("No Solana public key");
    }

    const signTransaction = solanaWallet.signTransaction.bind(solanaWallet);

    const postVaaSolanaTxIdsGenerator = this.generatePostVaaSolanaTxIds({
      interactionId,
      signTransaction,
      bridgeAddress: solanaWormhole.bridge,
      payer: solanaPublicKey.toBase58(),
      vaa: Buffer.from(vaaBytes),
      vaaKeypair,
    });
    for await (const txId of postVaaSolanaTxIdsGenerator) {
      yield txId;
    }
    const redeemTx = await createRedeemOnSolanaTx({
      interactionId,
      bridgeAddress: solanaWormhole.bridge,
      portalAddress: solanaWormhole.portal,
      payerAddress: solanaPublicKey.toBase58(),
      signedVaa: vaaBytes,
    });
    yield await this.sendAndConfirmTx(signTransaction, redeemTx);
  }

  public async confirmTx(
    txId: string,
    {
      maxRetries = DEFAULT_MAX_RETRIES,
      commitmentLevel = undefined,
    }: GetSolanaTransactionOptions = {},
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    // confirmTransaction() always fails if the signature is processed,
    // call getSignature() beforehand to circumvent.
    // TODO: Remove signature code once issue is addressed.
    // https://github.com/solana-labs/solana/issues/25955
    const signatureStatus = await this.getSigStatusToSigResult(txId);
    if (signatureStatus) {
      return signatureStatus;
    }
    return this.callWithRetry(async () => {
      const latestBlock = await this.rawConnection.getLatestBlockhash();
      // If the Solana network is busy this can time out
      const signatureResult = await this.rawConnection.confirmTransaction(
        {
          signature: txId,
          blockhash: latestBlock.blockhash,
          lastValidBlockHeight: latestBlock.lastValidBlockHeight,
        },
        commitmentLevel,
      );
      if (!signatureResult.value.err) {
        return signatureResult;
      }
      throw new Error(
        `Transaction with ID ${txId} did not confirm: ${signatureResult.value.err.toString()}`,
      );
    }, maxRetries);
  }

  public async sendAndConfirmTx(
    signTransaction: (tx: Transaction) => Promise<Transaction>,
    unsignedTx: Transaction,
    options: GetSolanaTransactionOptions = {},
  ): Promise<string> {
    const latestBlock = await this.rawConnection.getLatestBlockhash();
    // eslint-disable-next-line functional/immutable-data
    unsignedTx.recentBlockhash = latestBlock.blockhash;
    // eslint-disable-next-line functional/immutable-data
    unsignedTx.lastValidBlockHeight = latestBlock.lastValidBlockHeight;
    const signed = await signTransaction(unsignedTx);
    const txId = await this.rawConnection.sendRawTransaction(
      signed.serialize(),
    );
    await this.confirmTx(txId, options);
    return txId;
  }

  /**
   * Adapted from https://github.com/certusone/wormhole/blob/2998031b164051a466bb98c71d89301ed482b4c5/sdk/js/src/utils/solana.ts#L7-L58
   * The transactions provided to this function should be ready to be sent.
   * This function will only add the feePayer and blockhash, and then sign, send, and confirm the transaction.
   */
  public async sendAndConfirmTxs(
    signTransaction: (tx: Transaction) => Promise<Transaction>,
    unsignedTxs: readonly Transaction[],
    options: GetSolanaTransactionOptions = {},
  ): Promise<readonly string[]> {
    let txIds: readonly string[] = [];
    for (const tx of unsignedTxs) {
      const txId = await this.sendAndConfirmTx(signTransaction, tx, options);
      txIds = [...txIds, txId];
    }
    return txIds;
  }

  public async getTx(
    txId: string,
    {
      maxRetries = DEFAULT_MAX_RETRIES,
      commitmentLevel = undefined,
    }: GetSolanaTransactionOptions = {},
  ): Promise<VersionedTransactionResponse> {
    const knownTx = this.txCache.get(txId);
    if (knownTx !== undefined) {
      return knownTx;
    }
    // This uses websocket and a longer timeout than getTransaction
    await this.confirmTx(txId, {
      maxRetries,
      commitmentLevel,
    });

    // NOTE: Sometimes txs aren’t found straightaway even after confirming.
    // So we retry getting the tx too if necessary.
    return this.callWithRetry(async () => {
      const txResponse = await this.rawConnection.getTransaction(txId, {
        commitment: commitmentLevel,
        maxSupportedTransactionVersion: 0,
      });
      if (txResponse !== null) {
        this.txCache.set(txId, txResponse);
        return txResponse;
      }
      throw new Error(`Transaction with ID ${txId} did not confirm`);
    }, maxRetries);
  }

  public async getParsedTx(
    txId: string,
    {
      maxRetries = DEFAULT_MAX_RETRIES,
      commitmentLevel = undefined,
    }: GetSolanaTransactionOptions = {},
  ): Promise<ParsedTransactionWithMeta> {
    const knownTx = this.parsedTxCache.get(txId);
    if (knownTx !== undefined) {
      return knownTx;
    }

    // This uses websocket and a longer timeout than getParsedTransaction
    await this.confirmTx(txId, {
      maxRetries,
      commitmentLevel,
    });

    // NOTE: Sometimes txs aren’t found straightaway even after confirming.
    // So we retry getting the tx too if necessary.
    return this.callWithRetry(async () => {
      const txResponse = await this.rawConnection.getParsedTransaction(
        txId,
        commitmentLevel,
      );
      if (txResponse !== null) {
        this.parsedTxCache.set(txId, txResponse);
        return txResponse;
      }
      throw new Error(`Transaction with ID ${txId} did not confirm`);
    }, maxRetries);
  }

  public async getParsedTxs(
    txIds: readonly string[],
    {
      maxRetries = DEFAULT_MAX_RETRIES,
      commitmentLevel = undefined,
    }: GetSolanaTransactionOptions = {},
  ): Promise<readonly ParsedTransactionWithMeta[]> {
    return this.callWithRetry(
      async () => {
        const missingTxIds = txIds.filter(
          (txId) => !this.parsedTxCache.get(txId),
        );
        if (missingTxIds.length === 0) {
          return txIds.map((txId) => {
            const tx = this.parsedTxCache.get(txId);
            if (!tx) {
              // NOTE: This check is only here for type safety and should never happen
              throw new Error("Missing transaction");
            }
            return tx;
          });
        }
        // NOTE: Sometimes this won’t find all the txs immediately so we retry if necessary
        const txResponses = await this.rawConnection.getParsedTransactions(
          missingTxIds,
          commitmentLevel,
        );
        txResponses.forEach((txResponse, i) => {
          if (txResponse !== null) {
            this.parsedTxCache.set(missingTxIds[i], txResponse);
          }
        });
        throw new Error("One or more transactions did not confirm");
      },

      maxRetries,
    );
  }

  public async getTokenAccountWithRetry(
    mint: string,
    owner: string,
    {
      maxRetries = DEFAULT_MAX_RETRIES,
      commitmentLevel = undefined,
    }: GetSolanaTransactionOptions = {},
  ): Promise<TokenAccount> {
    const mintPubkey = new PublicKey(mint);
    const ownerPubkey = new PublicKey(owner);
    const associatedTokenAccountPubkey = await getAssociatedTokenAddress(
      mintPubkey,
      ownerPubkey,
    );
    return this.callWithRetry(async () => {
      const { value: accounts } =
        await this.rawConnection.getTokenAccountsByOwner(
          ownerPubkey,
          {
            mint: mintPubkey,
          },
          commitmentLevel,
        );
      const tokenAccount =
        accounts.find(
          ({ pubkey }) =>
            pubkey.toBase58() === associatedTokenAccountPubkey.toBase58(),
        ) ?? null;
      if (tokenAccount !== null) {
        return deserializeTokenAccount(
          tokenAccount.pubkey,
          tokenAccount.account.data,
        );
      }
      throw new Error(
        "Successfully created SPL token account but failed to fetch it",
      );
    }, maxRetries);
  }

  public async getMultipleTokenAccounts(
    keys: readonly string[],
    commitment?: Commitment,
  ): Promise<readonly (TokenAccount | null)[]> {
    // See https://docs.solana.com/developing/clients/jsonrpc-api#getmultipleaccounts
    const MAX_ACCOUNTS_PER_REQUEST = 99;
    const results = await Promise.all(
      chunks(keys, MAX_ACCOUNTS_PER_REQUEST).map((chunk) =>
        this.rawConnection.getMultipleAccountsInfo(
          chunk.map((key) => new PublicKey(key)),
          commitment,
        ),
      ),
    );
    return results.flatMap((accounts, i) =>
      accounts.map((account) =>
        account === null
          ? null
          : deserializeTokenAccount(new PublicKey(keys[i]), account.data),
      ),
    );
  }

  public async createSplTokenAccount(
    wallet: SolanaWalletAdapter,
    splTokenMintAddress: string,
  ): Promise<string> {
    if (!wallet.publicKey) {
      throw new Error("No Solana wallet connected");
    }
    const mint = new PublicKey(splTokenMintAddress);
    const associatedAccount = await getAssociatedTokenAddress(
      mint,
      wallet.publicKey,
    );
    const ix = createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      associatedAccount,
      wallet.publicKey,
      mint,
    );

    const tx = createTx({
      feePayer: wallet.publicKey,
    });
    tx.add(ix);
    return this.sendAndConfirmTx(wallet.signTransaction.bind(wallet), tx);
  }

  // Looks for a signature, only returns a value if there's no error
  // or value
  private async getSigStatusToSigResult(
    txId: string,
  ): Promise<RpcResponseAndContext<SignatureResult> | null> {
    try {
      const { context, value } = await this.rawConnection.getSignatureStatus(
        txId,
        { searchTransactionHistory: true },
      );
      if (!value) {
        return null;
      }
      return {
        context,
        value,
      };
    } catch {
      return null;
    }
  }

  private incrementRpcProvider() {
    if (
      this.endpoints.length === 1 &&
      (this.rawConnection as CustomConnection | undefined) !== undefined
    ) {
      // Skip initializing a new connection if there are no fallback endpoints
      // and it is not being called in the constructor (when this.rawConnection is still undefined)
      return;
    }
    if ((this.dummySubscriptionId as number | undefined) !== undefined) {
      // Remove old dummy subscription if it has been initialized.
      this.rawConnection
        .removeAccountChangeListener(this.dummySubscriptionId)
        .catch(console.error);
    }
    this.rpcIndex = (this.rpcIndex + 1) % this.endpoints.length;
    this.rawConnection = new CustomConnection(this.endpoints[this.rpcIndex], {
      commitment: DEFAULT_COMMITMENT_LEVEL,
      confirmTransactionInitialTimeout: 60 * 1000,
      disableRetryOnRateLimit: true,
    });
    this.getAccountInfo = this.rawConnection.getAccountInfo.bind(
      this.rawConnection,
    );
    this.getBalance = this.rawConnection.getBalance.bind(this.rawConnection);
    this.getMinimumBalanceForRentExemption =
      this.rawConnection.getMinimumBalanceForRentExemption.bind(
        this.rawConnection,
      );
    this.getLatestBlockhash = this.rawConnection.getLatestBlockhash.bind(
      this.rawConnection,
    );
    this.getSignaturesForAddress =
      this.rawConnection.getSignaturesForAddress.bind(this.rawConnection);
    this.getTokenAccountsByOwner =
      this.rawConnection.getTokenAccountsByOwner.bind(this.rawConnection);
    this.onAccountChange = this.rawConnection.onAccountChange.bind(
      this.rawConnection,
    );
    this.removeAccountChangeListener =
      this.rawConnection.removeAccountChangeListener.bind(this.rawConnection);
    this.dummySubscriptionId = this.rawConnection.onAccountChange(
      Keypair.generate().publicKey,
      () => {},
    );
  }

  private async callWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
  ): Promise<T> {
    let attempts = 0;
    while (attempts < maxRetries) {
      attempts++;
      try {
        return await fn();
      } catch (error: unknown) {
        if (attempts >= maxRetries) {
          throw error;
        } else if (error instanceof Error && error.name === "NetworkError") {
          this.incrementRpcProvider();
        } else {
          await sleep(DEFAULT_SLEEP_MS);
        }
      }
    }
    throw new Error("callWithRetry bug, this code should be unreachable.");
  }

  private async *generatePostVaaSolanaTxIds({
    interactionId,
    signTransaction,
    bridgeAddress,
    payer,
    vaa,
    vaaKeypair,
  }: {
    readonly interactionId: string;
    readonly signTransaction: (tx: Transaction) => Promise<Transaction>;
    readonly bridgeAddress: string;
    readonly payer: string;
    readonly vaa: Buffer;
    readonly vaaKeypair: Keypair;
  }): AsyncGenerator<string> {
    const memoIx = createMemoIx(interactionId, []);
    const verifyIxs: readonly TransactionInstruction[] =
      await createVerifySignaturesInstructionsSolana(
        this.rawConnection,
        bridgeAddress,
        payer,
        vaa,
        vaaKeypair,
      );
    const finalIx: TransactionInstruction =
      await createPostVaaInstructionSolana(
        bridgeAddress,
        payer,
        vaa,
        vaaKeypair,
      );

    // The verify signatures instructions can be batched into groups of 2 safely,
    // reducing the total number of transactions
    const batchableChunks = chunks(verifyIxs, 2);
    const unsignedTxs = batchableChunks.map((chunk) =>
      createTx({
        feePayer: new PublicKey(payer),
      }).add(...chunk, memoIx),
    );
    // The postVaa instruction can only execute after the verifySignature transactions have
    // successfully completed
    const finalTx = createTx({
      feePayer: new PublicKey(payer),
    }).add(finalIx, memoIx);

    // The signatureSet keypair also needs to sign the verifySignature transactions, thus a wrapper is needed
    const partialSignWrapper = async (
      tx: Transaction,
    ): Promise<Transaction> => {
      tx.partialSign(vaaKeypair);
      return signTransaction(tx);
    };

    for (const tx of unsignedTxs) {
      yield await this.sendAndConfirmTx(partialSignWrapper, tx);
    }
    yield await this.sendAndConfirmTx(signTransaction, finalTx);
  }
}
