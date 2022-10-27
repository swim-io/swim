import { getEmitterAddressSolana } from "@certusone/wormhole-sdk";
import type { SplToken } from "@project-serum/anchor";
import { BN, Program, Spl, web3 } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import type { TransactionInstruction } from "@solana/web3.js";
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { getTokenDetails } from "@swim-io/core";
import {
  EVM_ECOSYSTEMS,
  evmAddressToWormhole,
  isEvmEcosystemId,
} from "@swim-io/evm";
import { Routing__factory } from "@swim-io/evm-contracts";
import type { SolanaChainConfig } from "@swim-io/solana";
import {
  SOLANA_ECOSYSTEM_ID,
  createMemoIx,
  parseSequenceFromLogSolana,
} from "@swim-io/solana";
import { idl } from "@swim-io/solana-contracts";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { findOrThrow } from "@swim-io/utils";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import { Protocol, getWormholeRetries, isSwimUsd } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type {
  CrossChainSolanaToEvmSwapInteractionState,
  OperationSpec,
} from "../../models";
import {
  InteractionType,
  SwapType,
  SwimDefiInstruction,
  doSingleSolanaPoolOperationV2,
  findOrCreateSplTokenAccount,
  getSwimUsdBalanceChange,
  getTokensByPool,
  humanDecimalToAtomicString,
  isSolanaPool,
} from "../../models";
import { getSignedVaaWithRetry } from "../../models/wormhole/guardiansRpc";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useAnchorProvider, useSolanaClient } from "../solana";
import { useSwimUsd } from "../swim";

const getApproveAndRevokeIxs = async (
  splToken: Program<SplToken>,
  tokenAccounts: ReadonlyArray<web3.PublicKey>,
  amounts: ReadonlyArray<BN>,
  delegate: web3.PublicKey,
  authority: web3.PublicKey,
): Promise<
  readonly [
    readonly TransactionInstruction[],
    readonly TransactionInstruction[],
  ]
> => {
  const approveIxs = Promise.all(
    tokenAccounts.map((tokenAccount, i) => {
      return splToken.methods
        .approve(amounts[i])
        .accounts({
          source: tokenAccount,
          delegate,
          authority,
        })
        .instruction();
    }),
  );
  const revokeIxs = Promise.all(
    tokenAccounts.map((tokenAccount) => {
      return splToken.methods
        .revoke()
        .accounts({
          source: tokenAccount,
          authority,
        })
        .instruction();
    }),
  );
  return Promise.all([approveIxs, revokeIxs]);
};

const getToTokenNumberMapPda = async (
  propellerState: PublicKey,
  toTokenNumber: number,
  propellerProgramId: PublicKey,
) => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from("propeller"),
      Buffer.from("token_id"),
      propellerState.toBuffer(),
      new BN(toTokenNumber).toArrayLike(Buffer, "le", 2),
    ],
    propellerProgramId,
  );
};

const getAccounts = async (
  solanaChainConfig: SolanaChainConfig,
  walletPublicKey: PublicKey,
  auxiliarySigner: PublicKey,
  toTokenNumber: number,
) => {
  const bridgePublicKey = new PublicKey(solanaChainConfig.wormhole.bridge);
  const portalPublicKey = new PublicKey(solanaChainConfig.wormhole.portal);
  const swimUsdMintPublicKey = new PublicKey(
    solanaChainConfig.swimUsdDetails.address,
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
  const userSwimUsdAta = await getAssociatedTokenAddress(
    swimUsdMintPublicKey,
    walletPublicKey,
  );
  const propeller = new PublicKey(
    solanaChainConfig.routingContractStateAddress,
  );
  const propellerProgramId = new PublicKey(
    solanaChainConfig.routingContractAddress,
  );
  const [tokenIdMap] = await getToTokenNumberMapPda(
    propeller,
    toTokenNumber,
    propellerProgramId,
  );
  return {
    propeller,
    payer: walletPublicKey,
    tokenBridgeConfig,
    userSwimUsdAta,
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
    clock: web3.SYSVAR_CLOCK_PUBKEY,
    rent: web3.SYSVAR_RENT_PUBKEY,
    wormhole: bridgePublicKey,
    tokenProgram: TOKEN_PROGRAM_ID,

    tokenIdMap,
    // sender: walletPublicKey,
    // systemProgram: SystemProgram.programId,
    // tokenIdMap: userSwimUsdAta,
  };
};

export const useCrossChainSolanaToEvmSwapInteractionMutation = () => {
  const { updateInteractionState } = useInteractionStateV2();
  const { env } = useEnvironment();
  const config = useEnvironment(selectConfig, shallow);
  const { chains, wormhole, ecosystems } = config;
  const solanaWormhole = chains[Protocol.Solana][0].wormhole;
  const wallets = useWallets();
  const solanaClient = useSolanaClient();
  const getEvmClient = useGetEvmClient();
  const swimUsd = useSwimUsd();
  const tokensByPoolId = getTokensByPool(config);
  const anchorProvider = useAnchorProvider();

  return useMutation(
    async (interactionState: CrossChainSolanaToEvmSwapInteractionState) => {
      if (swimUsd === null) {
        throw new Error("SwimUsd not found");
      }
      const { interaction, requiredSplTokenAccounts } = interactionState;
      const { fromTokenData, toTokenData, firstMinimumOutputAmount } =
        interaction.params;
      if (firstMinimumOutputAmount === null) {
        throw new Error("Missing first minimum output amount");
      }
      const fromTokenSpec = fromTokenData.tokenConfig;
      const toTokenSpec = toTokenData.tokenConfig;
      const fromWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;
      if (fromWallet === null || fromWallet.address === null) {
        throw new Error("Solana wallet not connected");
      }
      const toEcosystem = toTokenData.ecosystemId;
      if (!isEvmEcosystemId(toEcosystem)) {
        throw new Error("Expect EVM ecosystem id");
      }
      const toChainConfig = EVM_ECOSYSTEMS[toEcosystem].chains[env] ?? null;
      if (toChainConfig === null) {
        throw new Error(`${toEcosystem} chain config not found`);
      }
      const toWallet = wallets[toEcosystem].wallet;
      if (
        toWallet === null ||
        toWallet.address === null ||
        toWallet.signer === null
      ) {
        throw new Error(`${toEcosystem} wallet not found`);
      }
      if (!wormhole) {
        throw new Error("No Wormhole RPC configured");
      }
      if (anchorProvider === null || fromWallet.publicKey === null) {
        throw new Error("Provider not found");
      }
      const propeller = new Program(
        idl.propeller,
        chains["solana-protocol"][0].routingContractAddress,
        anchorProvider,
      );

      const fromAmount = humanDecimalToAtomicString(
        fromTokenData.value,
        fromTokenData.tokenConfig,
        fromTokenData.ecosystemId,
      );
      const [solanaChainConfig] = chains[Protocol.Solana];
      const auxiliarySigner = Keypair.generate();
      const setComputeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 900_000,
      });
      const tokenProject = TOKEN_PROJECTS_BY_ID[fromTokenSpec.projectId];
      if (tokenProject.tokenNumber === null) {
        throw new Error(`Token number for ${tokenProject.symbol} not found`);
      }
      const accounts = await getAccounts(
        solanaChainConfig,
        fromWallet.publicKey,
        auxiliarySigner.publicKey,
        tokenProject.tokenNumber,
      );
      const splToken = Spl.token(anchorProvider);
      const swimUsdMintPublicKey = new PublicKey(
        solanaChainConfig.swimUsdDetails.address,
      );
      const userSwimUsdAta = await getAssociatedTokenAddress(
        swimUsdMintPublicKey,
        fromWallet.publicKey,
      );
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userSwimUsdAta],
        [new BN(fromAmount)],
        auxiliarySigner.publicKey,
        fromWallet.publicKey,
      );

      Object.entries(accounts).forEach(([key, publicKey]) =>
        console.log(key, publicKey.toBase58()),
      );

      const txToSign = await propeller.methods
        .crossChainTransferNativeWithPayload(
          new BN(fromAmount),
          ecosystems[toEcosystem].wormholeChainId,
          Buffer.from(evmAddressToWormhole(toWallet.address)),
        )
        .accounts(accounts)
        .preInstructions([setComputeUnitLimitIx, ...approveIxs])
        .postInstructions([...revokeIxs, createMemoIx(interaction.id, [])])
        .transaction();
      // eslint-disable-next-line functional/immutable-data
      txToSign.feePayer = fromWallet.publicKey;

      const transferSwimUsdToEvmTxId = await solanaClient.sendAndConfirmTx(
        (tx) => {
          return fromWallet.signTransaction(tx);
        },
        txToSign,
      );
      updateInteractionState(interaction.id, (draft) => {
        if (
          draft.interactionType !== InteractionType.SwapV2 ||
          draft.swapType !== SwapType.CrossChainSolanaToEvm
        ) {
          throw new Error("Interaction type mismatch");
        }
        draft.transferSwimUsdToEvmTxId = transferSwimUsdToEvmTxId;
      });
      const transferSwimUsdToEvmTx = await solanaClient.getTx(
        transferSwimUsdToEvmTxId,
      );
      const sequence = parseSequenceFromLogSolana(
        transferSwimUsdToEvmTx.original,
      );
      const emitterAddress = await getEmitterAddressSolana(
        solanaWormhole.portal,
      );
      const { wormholeChainId: emitterChainId } =
        ecosystems[SOLANA_ECOSYSTEM_ID];
      const retries = getWormholeRetries(emitterChainId);
      const vaaBytesResponse = await getSignedVaaWithRetry(
        [...wormhole.rpcUrls],
        emitterChainId,
        emitterAddress,
        sequence,
        undefined,
        undefined,
        retries,
      );
      const evmChain = findOrThrow(
        chains[Protocol.Evm],
        ({ ecosystem }) => ecosystem === toEcosystem,
      );
      await toWallet.switchNetwork(evmChain.chainId);
      const toRouting = Routing__factory.connect(
        toChainConfig.routingContractAddress,
        getEvmClient(toEcosystem).provider,
      );
      const toTokenDetails = getTokenDetails(
        toChainConfig,
        toTokenSpec.projectId,
      );
      const crossChainCompleteRequest = await toRouting.populateTransaction[
        "crossChainComplete(bytes,address,uint256,bytes16)"
      ](
        vaaBytesResponse.vaaBytes,
        toTokenDetails.address,
        humanDecimalToAtomicString(
          toTokenData.value,
          toTokenSpec,
          toTokenData.ecosystemId,
        ),
        `0x${interaction.id}`,
      );
      const crossChainCompleteResponse = await toWallet.signer.sendTransaction(
        crossChainCompleteRequest,
      );
      updateInteractionState(interaction.id, (draft) => {
        if (
          draft.interactionType !== InteractionType.SwapV2 ||
          draft.swapType !== SwapType.CrossChainSolanaToEvm
        ) {
          throw new Error("Interaction type mismatch");
        }
        draft.crossChainCompleteTxId = crossChainCompleteResponse.hash;
      });
    },
  );
};
