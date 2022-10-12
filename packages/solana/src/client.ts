import {
  createPostVaaInstructionSolana,
  createVerifySignaturesInstructionsSolana,
} from "@certusone/wormhole-sdk";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type {
  Commitment,
  Finality,
  ParsedTransactionWithMeta,
  RpcResponseAndContext,
  SignatureResult,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import type {
  CompleteWormholeTransferParams,
  InitiateWormholeTransferParams,
  TokenDetails,
} from "@swim-io/core";
import { Client, getTokenDetails } from "@swim-io/core";
import { atomicToHuman, chunks, sleep } from "@swim-io/utils";
import Decimal from "decimal.js";

import type {
  SolanaChainConfig,
  SolanaEcosystemId,
  SolanaTx,
} from "./protocol";
import { SOLANA_ECOSYSTEM_ID } from "./protocol";
import type { TokenAccount } from "./serialization";
import { deserializeTokenAccount } from "./serialization";
import { createMemoIx, createTx } from "./utils";
import type { SolanaWalletAdapter } from "./walletAdapters";
import { createRedeemOnSolanaTx, createTransferFromSolanaTx } from "./wormhole";

export const DEFAULT_MAX_RETRIES = 10;
export const DEFAULT_COMMITMENT_LEVEL: Finality = "confirmed";
const DEFAULT_SLEEP_MS = 1000;

type WithOptionalAuxiliarySigner<T> = T & {
  readonly auxiliarySigner?: Keypair;
};

interface GeneratePostVaaTxIdsParams
  extends Omit<
    WithOptionalAuxiliarySigner<
      CompleteWormholeTransferParams<SolanaWalletAdapter>
    >,
    "wallet"
  > {
  readonly signTx: (tx: Transaction) => Promise<Transaction>;
  readonly payerAddress: string;
}

export interface GetSolanaTransactionOptions {
  readonly maxRetries?: number;
  readonly commitmentLevel?: Finality;
}

export class CustomConnection extends Connection {
  // re-declare so we can use it here
  protected _rpcWebSocketHeartbeat: ReturnType<typeof setInterval> | null =
    null;

  protected _wsOnOpen(): void {
    // @ts-expect-error Solana marked most of their methods as internal
    super._wsOnOpen();

    // Prevent the 5s pings since they are not supported by the WS server and eat up rate limits
    if (this._rpcWebSocketHeartbeat !== null) {
      clearInterval(this._rpcWebSocketHeartbeat);
    }
  }
}

export const parsedTxToSolanaTx = (
  txId: string,
  parsedTx: ParsedTransactionWithMeta,
): SolanaTx => ({
  id: txId,
  ecosystemId: SOLANA_ECOSYSTEM_ID,
  timestamp: parsedTx.blockTime ?? null,
  interactionId: null,
  parsedTx,
});

export interface SolanaClientOptions {
  readonly endpoints?: readonly string[];
}

/**
 * A wrapper class around Connection from @solana/web3.js
 * We want to use this for eg getting txs
 */
export class SolanaClient extends Client<
  SolanaEcosystemId,
  SolanaChainConfig,
  SolanaTx,
  SolanaWalletAdapter
> {
  public connection!: CustomConnection;
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly parsedTxCache: Map<string, ParsedTransactionWithMeta>;
  private rpcIndex: number;
  private readonly endpoints: readonly string[];
  // TODO: Check if this is still necessary.
  // The websocket library solana/web3.js closes its websocket connection when the subscription list
  // is empty after opening its first time, preventing subsequent subscriptions from receiving responses.
  // This is a hack to prevent the list from ever getting empty
  private dummySubscriptionId?: number;

  public constructor(
    chainConfig: SolanaChainConfig,
    { endpoints }: SolanaClientOptions,
  ) {
    super(SOLANA_ECOSYSTEM_ID, chainConfig);
    this.endpoints = endpoints ?? chainConfig.publicRpcUrls;
    this.rpcIndex = -1;
    this.incrementRpcProvider();
    this.parsedTxCache = new Map<string, ParsedTransactionWithMeta>();
  }

  public async getTx(txId: string): Promise<SolanaTx> {
    const parsedTx = await this.getParsedTx(txId);
    return parsedTxToSolanaTx(txId, parsedTx);
  }

  public async getTxs(txIds: readonly string[]): Promise<readonly SolanaTx[]> {
    const parsedTxs = await this.getParsedTxs(txIds);
    return parsedTxs.map((parsedTx, i) =>
      parsedTxToSolanaTx(txIds[i], parsedTx),
    );
  }

  public async getGasBalance(address: string): Promise<Decimal> {
    const balance = await this.connection.getBalance(new PublicKey(address));
    return new Decimal(balance).dividedBy(LAMPORTS_PER_SOL);
  }

  public async getTokenBalance(
    owner: string,
    { address, decimals }: TokenDetails,
  ): Promise<Decimal> {
    const tokenAccount = await this.getTokenAccountWithRetry(address, owner);
    return atomicToHuman(new Decimal(tokenAccount.amount.toString()), decimals);
  }

  public async getTokenBalances(
    owner: string,
    tokenDetails: readonly TokenDetails[],
  ): Promise<readonly Decimal[]> {
    const tokenAccountPubkeys = await Promise.all(
      tokenDetails.map(({ address }) =>
        getAssociatedTokenAddress(new PublicKey(address), new PublicKey(owner)),
      ),
    );
    const tokenAccounts = await this.getMultipleTokenAccounts(
      tokenAccountPubkeys.map((pubkey) => pubkey.toBase58()),
    );
    return tokenAccounts.map((tokenAccount, i) =>
      atomicToHuman(
        new Decimal(tokenAccount?.amount.toString() ?? new Decimal(0)),
        tokenDetails[i].decimals,
      ),
    );
  }

  public async initiateWormholeTransfer({
    atomicAmount,
    targetChainId,
    targetAddress,
    interactionId,
    tokenProjectId,
    wallet,
    wrappedTokenInfo,
    auxiliarySigner = Keypair.generate(),
  }: WithOptionalAuxiliarySigner<
    InitiateWormholeTransferParams<SolanaWalletAdapter>
  >): Promise<string> {
    const solanaWalletAddress = wallet.publicKey?.toBase58() ?? null;
    if (solanaWalletAddress === null) {
      throw new Error("No Solana wallet address");
    }
    const mintAddress =
      wrappedTokenInfo?.wrappedAddress ??
      getTokenDetails(this.chainConfig, tokenProjectId).address;
    const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
      new PublicKey(mintAddress),
      new PublicKey(solanaWalletAddress),
    ).toBase58();
    const tx = await createTransferFromSolanaTx({
      interactionId,
      connection: this.connection,
      bridgeAddress: this.chainConfig.wormhole.bridge,
      portalAddress: this.chainConfig.wormhole.portal,
      payerAddress: solanaWalletAddress,
      auxiliarySignerAddress: auxiliarySigner.publicKey.toString(),
      fromAddress: associatedTokenAccountAddress,
      mintAddress,
      amount: BigInt(atomicAmount),
      targetAddress,
      targetChainId,
      originAddress: wrappedTokenInfo?.originAddress,
      originChain: wrappedTokenInfo?.originChainId,
    });
    return await this.sendAndConfirmTx(async (txToSign: Transaction) => {
      txToSign.partialSign(auxiliarySigner);
      return wallet.signTransaction(txToSign);
    }, tx);
  }

  public async *generateCompleteWormholeTransferTxIds({
    interactionId,
    vaa,
    wallet,
    auxiliarySigner,
  }: WithOptionalAuxiliarySigner<
    CompleteWormholeTransferParams<SolanaWalletAdapter>
  >): AsyncGenerator<string> {
    const walletAddress = wallet.publicKey?.toBase58();
    if (!walletAddress) {
      throw new Error("No Solana public key");
    }

    const signTx = wallet.signTransaction.bind(wallet);

    const postVaaSolanaTxIdsGenerator = this.generatePostVaaTxIds({
      interactionId,
      signTx,
      payerAddress: walletAddress,
      vaa,
      auxiliarySigner,
    });
    for await (const txId of postVaaSolanaTxIdsGenerator) {
      yield txId;
    }
    const redeemTx = await createRedeemOnSolanaTx({
      interactionId,
      bridgeAddress: this.chainConfig.wormhole.bridge,
      portalAddress: this.chainConfig.wormhole.portal,
      payerAddress: walletAddress,
      vaa,
    });
    yield await this.sendAndConfirmTx(signTx, redeemTx);
  }

  public async completeWormholeTransfer(
    params: WithOptionalAuxiliarySigner<
      CompleteWormholeTransferParams<SolanaWalletAdapter>
    >,
  ): Promise<readonly string[]> {
    let txIds: readonly string[] = [];
    const generator = this.generateCompleteWormholeTransferTxIds(params);
    for await (const txId of generator) {
      txIds = [...txIds, txId];
    }
    return txIds;
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
    const signatureResult = await this.getSignatureResult(txId);
    if (signatureResult) {
      return signatureResult;
    }
    return this.callWithRetry(async () => {
      const latestBlock = await this.connection.getLatestBlockhash();
      // If the Solana network is busy this can time out
      const response = await this.connection.confirmTransaction(
        {
          signature: txId,
          blockhash: latestBlock.blockhash,
          lastValidBlockHeight: latestBlock.lastValidBlockHeight,
        },
        commitmentLevel,
      );
      if (!response.value.err) {
        return response;
      }
      throw new Error(
        `Transaction with ID ${txId} did not confirm: ${response.value.err.toString()}`,
      );
    }, maxRetries);
  }

  public async sendAndConfirmTx(
    signTransaction: (tx: Transaction) => Promise<Transaction>,
    unsignedTx: Transaction,
    options: GetSolanaTransactionOptions = {},
  ): Promise<string> {
    const latestBlock = await this.connection.getLatestBlockhash();
    // eslint-disable-next-line functional/immutable-data
    unsignedTx.recentBlockhash = latestBlock.blockhash;
    // eslint-disable-next-line functional/immutable-data
    unsignedTx.lastValidBlockHeight = latestBlock.lastValidBlockHeight;
    const signed = await signTransaction(unsignedTx);
    const txId = await this.connection.sendRawTransaction(signed.serialize());
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
      const { value: accounts } = await this.connection.getTokenAccountsByOwner(
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
        this.connection.getMultipleAccountsInfo(
          chunk.map((key) => new PublicKey(key)),
          commitment,
        ),
      ),
    );
    return results.flat().map((account, i) => {
      return account === null
        ? null
        : deserializeTokenAccount(new PublicKey(keys[i]), account.data);
    });
  }

  private incrementRpcProvider() {
    if (
      this.endpoints.length === 1 &&
      (this.connection as CustomConnection | undefined) !== undefined
    ) {
      // Skip initializing a new connection if there are no fallback endpoints
      // and it is not being called in the constructor (when this.connection is still undefined)
      return;
    }
    if (this.dummySubscriptionId !== undefined) {
      // Remove old dummy subscription if it has been initialized.
      this.connection
        .removeAccountChangeListener(this.dummySubscriptionId)
        .catch(console.error);
    }
    this.rpcIndex = (this.rpcIndex + 1) % this.endpoints.length;
    this.connection = new CustomConnection(this.endpoints[this.rpcIndex], {
      commitment: DEFAULT_COMMITMENT_LEVEL,
      confirmTransactionInitialTimeout: 60 * 1000,
      disableRetryOnRateLimit: true,
    });
    this.dummySubscriptionId = this.connection.onAccountChange(
      Keypair.generate().publicKey,
      () => {},
    );
  }

  // Looks for a signature, only returns a value if there's no error
  // or value
  private async getSignatureResult(
    txId: string,
  ): Promise<RpcResponseAndContext<SignatureResult> | null> {
    try {
      const { context, value } = await this.connection.getSignatureStatus(
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

  private async getParsedTx(
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
      const txResponse = await this.connection.getParsedTransaction(
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

  private async getParsedTxs(
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
        const txResponses = await this.connection.getParsedTransactions(
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

  private async *generatePostVaaTxIds({
    interactionId,
    payerAddress,
    vaa,
    signTx,
    auxiliarySigner = Keypair.generate(),
  }: GeneratePostVaaTxIdsParams): AsyncGenerator<string> {
    const memoIx = createMemoIx(interactionId, []);
    const verifyIxs: readonly TransactionInstruction[] =
      await createVerifySignaturesInstructionsSolana(
        this.connection,
        this.chainConfig.wormhole.bridge,
        payerAddress,
        Buffer.from(vaa),
        auxiliarySigner,
      );
    const finalIx: TransactionInstruction =
      await createPostVaaInstructionSolana(
        this.chainConfig.wormhole.bridge,
        payerAddress,
        Buffer.from(vaa),
        auxiliarySigner,
      );

    // The verify signatures instructions can be batched into groups of 2 safely,
    // reducing the total number of transactions
    const batchableChunks = chunks(verifyIxs, 2);
    const feePayer = new PublicKey(payerAddress);
    const unsignedTxs = batchableChunks.map((chunk) =>
      createTx({ feePayer }).add(...chunk, memoIx),
    );
    // The postVaa instruction can only execute after the verifySignature transactions have
    // successfully completed
    const finalTx = createTx({ feePayer }).add(finalIx, memoIx);

    // The signatureSet keypair also needs to sign the verifySignature transactions, thus a wrapper is needed
    const partialSignWrapper = async (
      tx: Transaction,
    ): Promise<Transaction> => {
      tx.partialSign(auxiliarySigner);
      return signTx(tx);
    };

    for (const tx of unsignedTxs) {
      yield await this.sendAndConfirmTx(partialSignWrapper, tx);
    }
    yield await this.sendAndConfirmTx(signTx, finalTx);
  }
}
