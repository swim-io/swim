import type { ChainId } from "@certusone/wormhole-sdk";
import { createVerifySignaturesInstructionsSolana } from "@certusone/wormhole-sdk";
import type { Accounts } from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { createMemoInstruction } from "@solana/spl-memo";
import {
  TOKEN_PROGRAM_ID,
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
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
} from "@solana/web3.js";
import type {
  CompletePortalTransferParams,
  InitiatePortalTransferParams,
  InitiatePropellerParams,
  TokenDetails,
  TxGeneratorResult,
} from "@swim-io/core";
import { Client, getTokenDetails } from "@swim-io/core";
import type { Propeller } from "@swim-io/solana-contracts";
import { idl } from "@swim-io/solana-contracts";
import { TokenProjectId } from "@swim-io/token-projects";
import type { ReadonlyRecord } from "@swim-io/utils";
import { atomicToHuman, chunks, humanToAtomic, sleep } from "@swim-io/utils";
import BN from "bn.js";
import Decimal from "decimal.js";

import type {
  SolanaChainConfig,
  SolanaEcosystemId,
  SolanaTx,
} from "./protocol";
import { SOLANA_ECOSYSTEM_ID, SolanaTxType } from "./protocol";
import type { TokenAccount } from "./serialization";
import { deserializeTokenAccount } from "./serialization";
import {
  createApproveAndRevokeIxs,
  createTx,
  parsedTxToSolanaTx,
} from "./utils";
import { extractOutputAmountFromAddTx } from "./utils/propeller";
import type { SolanaWalletAdapter } from "./walletAdapters";
import {
  createPostVaaTx,
  createRedeemOnSolanaTx,
  createTransferFromSolanaTx,
} from "./wormhole";

export const DEFAULT_MAX_RETRIES = 10;
export const DEFAULT_COMMITMENT_LEVEL: Finality = "confirmed";
const DEFAULT_SLEEP_MS = 1000;

type WithOptionalAuxiliarySigner<T> = T & {
  readonly auxiliarySigner?: Keypair;
};

type CompleteWormholeMessageParams =
  CompletePortalTransferParams<SolanaWalletAdapter>;

interface GenerateVerifySignaturesTxsParams
  extends Omit<CompletePortalTransferParams<SolanaWalletAdapter>, "wallet"> {
  readonly signTx: (tx: Transaction) => Promise<Transaction>;
  readonly payerAddress: string;
  readonly auxiliarySigner: Keypair;
}

type SupportedTokenProjectId =
  | TokenProjectId.SwimUsd
  | TokenProjectId.Usdc
  | TokenProjectId.Usdt;

const SUPPORTED_TOKEN_PROJECT_IDS = [
  TokenProjectId.SwimUsd,
  TokenProjectId.Usdc,
  TokenProjectId.Usdt,
];

const isSupportedTokenProjectId = (
  id: TokenProjectId,
): id is SupportedTokenProjectId => SUPPORTED_TOKEN_PROJECT_IDS.includes(id);

interface PropellerAddParams {
  readonly wallet: SolanaWalletAdapter;
  readonly routingContract: Program<Propeller>;
  readonly interactionId: string;
  readonly senderPublicKey: PublicKey;
  readonly sourceTokenId: SupportedTokenProjectId;
  readonly inputAmountAtomic: string;
}

interface PropellerTransferParams {
  readonly wallet: SolanaWalletAdapter;
  readonly routingContract: Program<Propeller>;
  readonly interactionId: string;
  readonly senderPublicKey: PublicKey;
  readonly targetWormholeChainId: ChainId;
  readonly targetTokenNumber: number;
  readonly targetWormholeAddress: Uint8Array;
  readonly inputAmountAtomic: string;
  readonly maxPropellerFeeAtomic: string;
  readonly gasKickStart: boolean;
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
  ParsedTransactionWithMeta,
  SolanaTxType,
  SolanaTx,
  SolanaWalletAdapter
> {
  public connection!: CustomConnection;
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly parsedTxCache: Map<string, ParsedTransactionWithMeta>;
  private rpcIndex: number;
  private readonly endpoints: readonly string[];

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
    return parsedTxToSolanaTx(parsedTx);
  }

  public async getTxs(txIds: readonly string[]): Promise<readonly SolanaTx[]> {
    const parsedTxs = await this.getParsedTxs(txIds);
    return parsedTxs.map((parsedTx) => parsedTxToSolanaTx(parsedTx));
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

  public async *generateInitiatePortalTransferTxs({
    atomicAmount,
    targetChainId,
    targetAddress,
    interactionId,
    tokenProjectId,
    wallet,
    wrappedTokenInfo,
    auxiliarySigner = Keypair.generate(),
  }: WithOptionalAuxiliarySigner<
    InitiatePortalTransferParams<SolanaWalletAdapter>
  >): AsyncGenerator<
    TxGeneratorResult<
      ParsedTransactionWithMeta,
      SolanaTx,
      SolanaTxType.PortalInitiateTransfer
    >
  > {
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
    const txRequest = await createTransferFromSolanaTx({
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
      wrappedTokenInfo,
    });
    const txId = await this.sendAndConfirmTx(async (txToSign: Transaction) => {
      txToSign.partialSign(auxiliarySigner);
      return wallet.signTransaction(txToSign);
    }, txRequest);
    const tx = await this.getTx(txId);
    yield {
      tx,
      type: SolanaTxType.PortalInitiateTransfer,
    };
  }

  public async *generateCompleteWormholeMessageTxs({
    interactionId,
    vaa,
    wallet,
    auxiliarySigner = Keypair.generate(),
  }: WithOptionalAuxiliarySigner<CompleteWormholeMessageParams>): AsyncGenerator<
    TxGeneratorResult<
      ParsedTransactionWithMeta,
      SolanaTx,
      SolanaTxType.WormholeVerifySignatures | SolanaTxType.WormholePostVaa
    >
  > {
    const walletAddress = wallet.publicKey?.toBase58();
    if (!walletAddress) {
      throw new Error("No Solana public key");
    }

    const signTx = wallet.signTransaction.bind(wallet);

    const verifySignaturesTxsGenerator = this.generateVerifySignaturesTxs({
      interactionId,
      signTx,
      payerAddress: walletAddress,
      vaa,
      auxiliarySigner,
    });
    for await (const verifyTxResult of verifySignaturesTxsGenerator) {
      yield verifyTxResult;
    }

    const postVaaTxRequest = await createPostVaaTx({
      interactionId,
      bridgeAddress: this.chainConfig.wormhole.bridge,
      payerAddress: walletAddress,
      vaa,
      auxiliarySigner,
    });
    const postVaaTxId = await this.sendAndConfirmTx(signTx, postVaaTxRequest);
    const postVaaTx = await this.getTx(postVaaTxId);
    yield {
      tx: postVaaTx,
      type: SolanaTxType.WormholePostVaa,
    };
  }

  public async *generateCompletePortalTransferTxs({
    interactionId,
    vaa,
    wallet,
    auxiliarySigner = Keypair.generate(),
  }: WithOptionalAuxiliarySigner<
    CompletePortalTransferParams<SolanaWalletAdapter>
  >): AsyncGenerator<
    TxGeneratorResult<
      ParsedTransactionWithMeta,
      SolanaTx,
      | SolanaTxType.WormholeVerifySignatures
      | SolanaTxType.WormholePostVaa
      | SolanaTxType.PortalRedeem
    >
  > {
    const walletAddress = wallet.publicKey?.toBase58();
    if (!walletAddress) {
      throw new Error("No Solana public key");
    }

    const signTx = wallet.signTransaction.bind(wallet);

    const completeWormholeTransferTxsGenerator =
      this.generateCompleteWormholeMessageTxs({
        interactionId,
        vaa,
        wallet,
        auxiliarySigner,
      });

    for await (const result of completeWormholeTransferTxsGenerator) {
      yield result;
    }

    const redeemTxRequest = await createRedeemOnSolanaTx({
      interactionId,
      bridgeAddress: this.chainConfig.wormhole.bridge,
      portalAddress: this.chainConfig.wormhole.portal,
      payerAddress: walletAddress,
      vaa,
    });
    const redeemTxId = await this.sendAndConfirmTx(signTx, redeemTxRequest);
    const redeemTx = await this.getTx(redeemTxId);
    yield {
      tx: redeemTx,
      type: SolanaTxType.PortalRedeem,
    };
  }

  public async *generateInitiatePropellerTxs({
    wallet,
    interactionId,
    sourceTokenId,
    targetWormholeChainId,
    targetTokenNumber,
    targetWormholeAddress,
    inputAmount,
    maxPropellerFeeAtomic,
    gasKickStart,
    auxiliarySigner = Keypair.generate(),
  }: WithOptionalAuxiliarySigner<
    InitiatePropellerParams<SolanaWalletAdapter>
  >): AsyncGenerator<
    TxGeneratorResult<ParsedTransactionWithMeta, SolanaTx, SolanaTxType>,
    any,
    unknown
  > {
    const senderPublicKey = wallet.publicKey;
    if (senderPublicKey === null) {
      throw new Error("Missing Solana wallet");
    }
    if (!isSupportedTokenProjectId(sourceTokenId)) {
      throw new Error("Invalid source token id");
    }

    const sourceTokenDetails = getTokenDetails(this.chainConfig, sourceTokenId);
    const inputAmountAtomic = humanToAtomic(
      inputAmount,
      sourceTokenDetails.decimals,
    ).toString();

    const anchorProvider = new AnchorProvider(
      this.connection,
      {
        ...wallet,
        publicKey: senderPublicKey,
      },
      { commitment: "confirmed" },
    );
    const routingContract = new Program(
      idl.propeller,
      this.chainConfig.routingContractAddress,
      anchorProvider,
    );

    let addOutputAmountAtomic: string | null = null;
    if (sourceTokenId !== TokenProjectId.SwimUsd) {
      const addTx = await this.propellerAdd({
        wallet,
        routingContract,
        interactionId,
        senderPublicKey,
        sourceTokenId,
        inputAmountAtomic,
      });

      yield {
        tx: addTx,
        type: SolanaTxType.SwimPropellerAdd,
      };

      const outputAmount = extractOutputAmountFromAddTx(addTx.original);
      if (!outputAmount) {
        throw new Error("Could not parse propeller add output amount from log");
      }
      addOutputAmountAtomic = outputAmount;
    }

    const swimUsdInputAmountAtomic = addOutputAmountAtomic ?? inputAmountAtomic;

    const transferTx = await this.propellerTransfer({
      wallet,
      routingContract,
      interactionId,
      senderPublicKey,
      targetWormholeChainId,
      targetTokenNumber,
      targetWormholeAddress,
      inputAmountAtomic: swimUsdInputAmountAtomic,
      maxPropellerFeeAtomic,
      gasKickStart,
      auxiliarySigner,
    });
    yield {
      tx: transferTx,
      type: SolanaTxType.SwimPropellerTransfer,
    };
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
    this.rpcIndex = (this.rpcIndex + 1) % this.endpoints.length;
    this.connection = new CustomConnection(this.endpoints[this.rpcIndex], {
      commitment: DEFAULT_COMMITMENT_LEVEL,
      confirmTransactionInitialTimeout: 60 * 1000,
      disableRetryOnRateLimit: true,
    });
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

  private async *generateVerifySignaturesTxs({
    interactionId,
    payerAddress,
    vaa,
    signTx,
    auxiliarySigner,
  }: GenerateVerifySignaturesTxsParams): AsyncGenerator<
    TxGeneratorResult<
      ParsedTransactionWithMeta,
      SolanaTx,
      SolanaTxType.WormholeVerifySignatures
    >
  > {
    const memoIx = createMemoInstruction(interactionId);
    const verifyIxs: readonly TransactionInstruction[] =
      await createVerifySignaturesInstructionsSolana(
        this.connection,
        this.chainConfig.wormhole.bridge,
        payerAddress,
        Buffer.from(vaa),
        auxiliarySigner,
      );

    // The verify signatures instructions can be batched into groups of 2 safely,
    // reducing the total number of transactions
    const batchableChunks = chunks(verifyIxs, 2);
    const feePayer = new PublicKey(payerAddress);
    const verifyTxRequests = batchableChunks.map((chunk) =>
      createTx({ feePayer }).add(...chunk, memoIx),
    );

    // The signatureSet keypair also needs to sign the verifySignature transactions, thus a wrapper is needed
    const partialSignWrapper = async (
      tx: Transaction,
    ): Promise<Transaction> => {
      tx.partialSign(auxiliarySigner);
      return signTx(tx);
    };

    for (const txRequest of verifyTxRequests) {
      const txId = await this.sendAndConfirmTx(partialSignWrapper, txRequest);
      const tx = await this.getTx(txId);
      yield {
        tx,
        type: SolanaTxType.WormholeVerifySignatures,
      };
    }
  }

  private getAddAccounts(
    userSwimUsdAtaPublicKey: PublicKey,
    userTokenAccounts: readonly PublicKey[],
    auxiliarySigner: PublicKey,
    lpMint: PublicKey,
    poolTokenAccounts: readonly PublicKey[],
    poolGovernanceFeeAccount: PublicKey,
  ): Accounts {
    return {
      propeller: new PublicKey(this.chainConfig.routingContractStateAddress),
      tokenProgram: TOKEN_PROGRAM_ID,
      poolTokenAccount0: poolTokenAccounts[0],
      poolTokenAccount1: poolTokenAccounts[1],
      lpMint,
      governanceFee: poolGovernanceFeeAccount,
      userTransferAuthority: auxiliarySigner,
      userTokenAccount0: userTokenAccounts[0],
      userTokenAccount1: userTokenAccounts[1],
      userLpTokenAccount: userSwimUsdAtaPublicKey,
      twoPoolProgram: new PublicKey(this.chainConfig.twoPoolContractAddress),
    };
  }

  private async getPropellerTransferAccounts(
    walletPublicKey: PublicKey,
    swimUsdAtaPublicKey: PublicKey,
    auxiliarySigner: PublicKey,
  ): Promise<Accounts> {
    const bridgePublicKey = new PublicKey(this.chainConfig.wormhole.bridge);
    const portalPublicKey = new PublicKey(this.chainConfig.wormhole.portal);
    const swimUsdMintPublicKey = new PublicKey(
      this.chainConfig.swimUsdDetails.address,
    );
    const [wormholeConfig] = await PublicKey.findProgramAddress(
      [Buffer.from("Bridge")],
      bridgePublicKey,
    );
    const [tokenBridgeConfig] = await PublicKey.findProgramAddress(
      [Buffer.from("config")],
      portalPublicKey,
    );
    const [custody] = await PublicKey.findProgramAddress(
      [swimUsdMintPublicKey.toBytes()],
      portalPublicKey,
    );
    const [custodySigner] = await PublicKey.findProgramAddress(
      [Buffer.from("custody_signer")],
      portalPublicKey,
    );
    const [authoritySigner] = await PublicKey.findProgramAddress(
      [Buffer.from("authority_signer")],
      portalPublicKey,
    );
    const [wormholeEmitter] = await PublicKey.findProgramAddress(
      [Buffer.from("emitter")],
      portalPublicKey,
    );
    const [wormholeSequence] = await PublicKey.findProgramAddress(
      [Buffer.from("Sequence"), wormholeEmitter.toBytes()],
      bridgePublicKey,
    );
    const [wormholeFeeCollector] = await PublicKey.findProgramAddress(
      [Buffer.from("fee_collector")],
      bridgePublicKey,
    );
    return {
      propeller: new PublicKey(this.chainConfig.routingContractStateAddress),
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: walletPublicKey,
      wormhole: bridgePublicKey,
      tokenBridgeConfig,
      userSwimUsdAta: swimUsdAtaPublicKey,
      swimUsdMint: swimUsdMintPublicKey,
      custody,
      tokenBridge: portalPublicKey,
      custodySigner,
      authoritySigner,
      wormholeConfig,
      wormholeMessage: auxiliarySigner,
      wormholeEmitter,
      wormholeSequence,
      wormholeFeeCollector,
      clock: SYSVAR_CLOCK_PUBKEY,
    };
  }

  private async propellerAdd({
    wallet,
    routingContract,
    interactionId,
    senderPublicKey,
    sourceTokenId,
    inputAmountAtomic,
    auxiliarySigner = Keypair.generate(),
  }: WithOptionalAuxiliarySigner<PropellerAddParams>): Promise<SolanaTx> {
    const [twoPoolConfig] = this.chainConfig.pools;
    const addInputAmounts =
      sourceTokenId === TokenProjectId.Usdc
        ? [inputAmountAtomic, "0"]
        : ["0", inputAmountAtomic];
    const addMaxFee = "0"; // TODO: Change to a real value

    const userTokenAccounts = SUPPORTED_TOKEN_PROJECT_IDS.reduce(
      (accumulator, tokenProjectId) => {
        const { address } = getTokenDetails(this.chainConfig, tokenProjectId);
        return {
          ...accumulator,
          [tokenProjectId]: getAssociatedTokenAddressSync(
            new PublicKey(address),
            senderPublicKey,
          ),
        };
      },
      {} as ReadonlyRecord<SupportedTokenProjectId, PublicKey>,
    );
    const addAccounts = this.getAddAccounts(
      userTokenAccounts[TokenProjectId.SwimUsd],
      [
        userTokenAccounts[TokenProjectId.Usdc],
        userTokenAccounts[TokenProjectId.Usdt],
      ],
      auxiliarySigner.publicKey,
      new PublicKey(this.chainConfig.swimUsdDetails.address),
      [...twoPoolConfig.tokenAccounts.values()].map(
        (address) => new PublicKey(address),
      ),
      new PublicKey(twoPoolConfig.governanceFeeAccount),
    );

    const [approveIx, revokeIx] = await createApproveAndRevokeIxs(
      userTokenAccounts[sourceTokenId],
      inputAmountAtomic,
      auxiliarySigner.publicKey,
      senderPublicKey,
    );
    const memoIx = createMemoInstruction(interactionId);

    const txRequest = await routingContract.methods
      .propellerAdd(
        addInputAmounts.map((amount) => new BN(amount)),
        new BN(addMaxFee),
      )
      .accounts(addAccounts)
      .preInstructions([approveIx])
      .postInstructions([revokeIx, memoIx])
      .signers([auxiliarySigner])
      .transaction();
    const txId = await this.sendAndConfirmTx(async (tx) => {
      tx.partialSign(auxiliarySigner);
      return wallet.signTransaction(tx);
    }, txRequest);
    return await this.getTx(txId);
  }

  private async propellerTransfer({
    wallet,
    routingContract,
    interactionId,
    senderPublicKey,
    targetWormholeChainId,
    targetTokenNumber,
    targetWormholeAddress,
    inputAmountAtomic,
    maxPropellerFeeAtomic,
    gasKickStart,
    auxiliarySigner = Keypair.generate(),
  }: WithOptionalAuxiliarySigner<PropellerTransferParams>): Promise<SolanaTx> {
    const memo = Buffer.from(interactionId, "hex");
    const setComputeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: 350_000,
    });
    const swimUsdTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(this.chainConfig.swimUsdDetails.address),
      senderPublicKey,
    );
    const transferAccounts = await this.getPropellerTransferAccounts(
      senderPublicKey,
      swimUsdTokenAccount,
      auxiliarySigner.publicKey,
    );
    const txRequest = await routingContract.methods
      .propellerTransferNativeWithPayload(
        new BN(inputAmountAtomic),
        targetWormholeChainId,
        targetWormholeAddress,
        gasKickStart,
        new BN(maxPropellerFeeAtomic),
        targetTokenNumber,
        memo,
      )
      .accounts(transferAccounts)
      .preInstructions([setComputeUnitLimitIx])
      .signers([auxiliarySigner])
      .transaction();

    const txId = await this.sendAndConfirmTx(async (tx) => {
      tx.partialSign(auxiliarySigner);
      return wallet.signTransaction(tx);
    }, txRequest);
    return await this.getTx(txId);
  }
}
