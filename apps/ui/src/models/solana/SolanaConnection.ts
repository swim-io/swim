import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type {
  Finality,
  ParsedTransactionWithMeta,
  RpcResponseAndContext,
  SignatureResult,
  Transaction,
  TransactionResponse,
} from "@solana/web3.js";
import { Connection, PublicKey } from "@solana/web3.js";

import { SwimError } from "../../errors";
import { sleep } from "../../utils";

import { deserializeTokenAccount } from "./parsers";
import { getAssociatedTokenAddress } from "./utils";

export const DEFAULT_MAX_RETRIES = 10;
export const DEFAULT_COMMITMENT_LEVEL: Finality = "confirmed";
const DEFAULT_SLEEP_MS = 1000;

interface GetSolanaTransactionOptions {
  readonly maxRetries?: number;
  readonly commitmentLevel?: Finality;
}

export class CustomConnection extends Connection {
  // re-declare so we can use it here
  _rpcWebSocketHeartbeat: ReturnType<typeof setInterval> | null = null;

  _wsOnOpen(): void {
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
  public getAccountInfo: InstanceType<typeof Connection>["getAccountInfo"];
  public getBalance: InstanceType<typeof Connection>["getBalance"];
  public getMinimumBalanceForRentExemption: InstanceType<
    typeof Connection
  >["getMinimumBalanceForRentExemption"];
  public getRecentBlockhash: InstanceType<
    typeof Connection
  >["getRecentBlockhash"];
  public getSignaturesForAddress: InstanceType<
    typeof Connection
  >["getSignaturesForAddress"];
  public getTokenAccountsByOwner: InstanceType<
    typeof Connection
  >["getTokenAccountsByOwner"];
  public onAccountChange: InstanceType<typeof Connection>["onAccountChange"];
  public removeAccountChangeListener: InstanceType<
    typeof Connection
  >["removeAccountChangeListener"];

  public rawConnection: CustomConnection;
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly txCache: Map<string, TransactionResponse>;
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly parsedTxCache: Map<string, ParsedTransactionWithMeta>;

  constructor(endpoint: string, wsEndpoint: string) {
    this.rawConnection = new CustomConnection(endpoint, {
      commitment: DEFAULT_COMMITMENT_LEVEL,
      confirmTransactionInitialTimeout: 60 * 1000,
      disableRetryOnRateLimit: true,
      wsEndpoint: wsEndpoint,
    });
    this.getAccountInfo = this.rawConnection.getAccountInfo.bind(
      this.rawConnection,
    );
    this.getBalance = this.rawConnection.getBalance.bind(this.rawConnection);
    this.getMinimumBalanceForRentExemption =
      this.rawConnection.getMinimumBalanceForRentExemption.bind(
        this.rawConnection,
      );
    this.getRecentBlockhash = this.rawConnection.getRecentBlockhash.bind(
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

    // NOTE: This design assumes no tx ID collisions between different environments eg Mainnet-beta and devnet.
    this.txCache = new Map<string, TransactionResponse>();
    this.parsedTxCache = new Map<string, ParsedTransactionWithMeta>();
  }

  async confirmTx(
    txId: string,
    {
      maxRetries = DEFAULT_MAX_RETRIES,
      commitmentLevel = undefined,
    }: GetSolanaTransactionOptions = {},
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    let remainingAttempts = maxRetries;
    let lastError = null;
    // confirmTransaction() always fails if the signature is processed,
    // call getSignature() beforehand to circumvent.
    // TODO: Remove signature code once issue is addressed.
    // https://github.com/solana-labs/solana/issues/25955
    const signatureStatus = await this.getSigStatusToSigResult(txId);
    if (signatureStatus) {
      return signatureStatus;
    }
    while (remainingAttempts >= 0) {
      try {
        // If the Solana network is busy this can time out
        return await this.rawConnection.confirmTransaction(
          txId,
          commitmentLevel,
        );
      } catch (e) {
        --remainingAttempts;
        lastError = e;
        await sleep(DEFAULT_SLEEP_MS);
      }
    }
    throw new SwimError(
      `Transaction with ID ${txId} did not confirm`,
      lastError,
    );
  }

  async sendAndConfirmTx(
    signTransaction: (tx: Transaction) => Promise<Transaction>,
    unsignedTx: Transaction,
    options: GetSolanaTransactionOptions = {},
  ): Promise<string> {
    const { blockhash } = await this.rawConnection.getRecentBlockhash();
    // eslint-disable-next-line functional/immutable-data
    unsignedTx.recentBlockhash = blockhash;
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
  async sendAndConfirmTxs(
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

  async getTx(
    txId: string,
    {
      maxRetries = DEFAULT_MAX_RETRIES,
      commitmentLevel = undefined,
    }: GetSolanaTransactionOptions = {},
  ): Promise<TransactionResponse> {
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
    let remainingAttempts = maxRetries;
    while (remainingAttempts >= 0) {
      const txResponse = await this.rawConnection.getTransaction(txId, {
        commitment: commitmentLevel,
      });
      if (txResponse !== null) {
        this.txCache.set(txId, txResponse);
        return txResponse;
      }
      await sleep(DEFAULT_SLEEP_MS);
      --remainingAttempts;
    }
    throw new SwimError(`Transaction with ID ${txId} did not confirm`);
  }

  async getParsedTx(
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
    let remainingAttempts = maxRetries;
    while (remainingAttempts >= 0) {
      const txResponse = await this.rawConnection.getParsedTransaction(
        txId,
        commitmentLevel,
      );
      if (txResponse !== null) {
        this.parsedTxCache.set(txId, txResponse);
        return txResponse;
      }
      await sleep(DEFAULT_SLEEP_MS);
      --remainingAttempts;
    }
    throw new SwimError(`Transaction with ID ${txId} did not confirm`);
  }

  async getParsedTxs(
    txIds: readonly string[],
    {
      maxRetries = DEFAULT_MAX_RETRIES,
      commitmentLevel = undefined,
    }: GetSolanaTransactionOptions = {},
  ): Promise<readonly ParsedTransactionWithMeta[]> {
    let remainingAttempts = maxRetries;
    while (remainingAttempts >= 0) {
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

      await sleep(DEFAULT_SLEEP_MS);
      --remainingAttempts;
    }
    throw new SwimError(`One or more transactions did not confirm`);
  }

  async getTokenAccountWithRetry(
    mint: string,
    owner: string,
    {
      maxRetries = DEFAULT_MAX_RETRIES,
      commitmentLevel = undefined,
    }: GetSolanaTransactionOptions = {},
  ): Promise<TokenAccount> {
    const mintPubkey = new PublicKey(mint);
    const ownerPubkey = new PublicKey(owner);
    const associatedTokenAccountAddress = getAssociatedTokenAddress(
      mintPubkey,
      ownerPubkey,
    ).toBase58();

    let remainingAttempts = maxRetries;
    while (remainingAttempts >= 0) {
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
          ({ pubkey }) => pubkey.toBase58() === associatedTokenAccountAddress,
        ) ?? null;
      if (tokenAccount !== null) {
        return deserializeTokenAccount(
          tokenAccount.pubkey,
          tokenAccount.account.data,
        );
      }
      await sleep(DEFAULT_SLEEP_MS);
      --remainingAttempts;
    }

    throw new Error(
      "Successfully created SPL token account but failed to fetch it",
    );
  }

  // Looks for a signature, only returns a value if there's no error
  // or value
  async getSigStatusToSigResult(
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
}
