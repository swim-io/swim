import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getTokenDetails } from "@swim-io/core";
import { EVM_ECOSYSTEMS, isEvmEcosystemId } from "@swim-io/evm";
import { Routing__factory } from "@swim-io/evm-contracts";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import { useMutation, useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import {
  getSolanaTokenDetails,
  getWormholeRetries,
  isSwimUsd,
} from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type {
  CrossChainEvmToSolanaSwapInteractionState,
  OperationSpec,
} from "../../models";
import {
  Amount,
  InteractionType,
  SwapType,
  SwimDefiInstruction,
  doSingleSolanaPoolOperationV2,
  findOrCreateSplTokenAccount,
  getSignedVaaWithRetry,
  getTokensByPool,
  humanDecimalToAtomicString,
  isSolanaPool,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useSolanaClient, useSplTokenAccountsQuery } from "../solana";
import { useSwimUsd } from "../swim";

export const useCrossChainEvmToSolanaSwapInteractionMutation = () => {
  const queryClient = useQueryClient();
  const { data: existingSplTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { updateInteractionState } = useInteractionStateV2();
  const wallets = useWallets();
  const solanaClient = useSolanaClient();
  const getEvmClient = useGetEvmClient();
  const { env } = useEnvironment();
  const config = useEnvironment(selectConfig, shallow);
  const { ecosystems, wormhole } = config;
  const swimUsd = useSwimUsd();
  const tokensByPoolId = getTokensByPool(config);

  return useMutation(
    async (interactionState: CrossChainEvmToSolanaSwapInteractionState) => {
      if (swimUsd === null) {
        throw new Error("SwimUsd not found");
      }
      if (wormhole === null) {
        throw new Error("No Wormhole RPC configured");
      }
      const { interaction, requiredSplTokenAccounts } = interactionState;
      const { fromTokenData, toTokenData, firstMinimumOutputAmount } =
        interaction.params;
      if (firstMinimumOutputAmount === null) {
        throw new Error("Missing first minimum output amount");
      }
      const fromEcosystem = fromTokenData.ecosystemId;
      const toEcosystem = toTokenData.ecosystemId;
      if (
        !isEvmEcosystemId(fromEcosystem) ||
        toEcosystem !== SOLANA_ECOSYSTEM_ID
      ) {
        throw new Error("Expect ecosystem id");
      }
      const fromWallet = wallets[fromEcosystem].wallet;
      if (
        fromWallet === null ||
        fromWallet.address === null ||
        fromWallet.signer === null
      ) {
        throw new Error(`${fromEcosystem} wallet not found`);
      }
      const toWallet = wallets[toEcosystem].wallet;
      if (toWallet === null || toWallet.address === null) {
        throw new Error(`${toEcosystem} wallet not found`);
      }
      const fromTokenSpec = fromTokenData.tokenConfig;
      const toTokenSpec = toTokenData.tokenConfig;
      const fromChainConfig = EVM_ECOSYSTEMS[fromEcosystem].chains[env] ?? null;
      if (fromChainConfig === null) {
        throw new Error(`${fromEcosystem} chain config not found`);
      }
      const fromTokenDetails = getTokenDetails(
        fromChainConfig,
        fromTokenSpec.projectId,
      );
      await fromWallet.switchNetwork(fromChainConfig.chainId);
      const evmClient = getEvmClient(fromEcosystem);
      const fromRouting = Routing__factory.connect(
        fromChainConfig.routingContractAddress,
        evmClient.provider,
      );
      const splTokenAccounts = await Promise.all(
        Object.keys(requiredSplTokenAccounts).map(async (mint) => {
          const { tokenAccount, creationTxId } =
            await findOrCreateSplTokenAccount({
              env: interaction.env,
              solanaClient,
              wallet: toWallet,
              queryClient,
              splTokenMintAddress: mint,
              splTokenAccounts: existingSplTokenAccounts,
            });
          // Update interactionState
          if (creationTxId !== null) {
            updateInteractionState(interaction.id, (draft) => {
              if (
                draft.interactionType !== InteractionType.SwapV2 ||
                draft.swapType !== SwapType.SingleChainSolana
              ) {
                throw new Error("Interaction type mismatch");
              }
              draft.requiredSplTokenAccounts[mint].txId = creationTxId;
            });
          }
          return tokenAccount;
        }),
      );
      const memo = Buffer.from(interaction.id, "hex");
      let { crossChainInitiateTxId } = interactionState;
      if (crossChainInitiateTxId === null) {
        const atomicAmount = humanDecimalToAtomicString(
          fromTokenData.value,
          fromTokenData.tokenConfig,
          fromTokenData.ecosystemId,
        );
        const approvalResponses = await evmClient.approveTokenAmount({
          atomicAmount,
          mintAddress: fromTokenDetails.address,
          wallet: fromWallet,
          spenderAddress: fromChainConfig.routingContractAddress,
        });
        updateInteractionState(interaction.id, (draft) => {
          if (
            draft.interactionType !== InteractionType.SwapV2 ||
            draft.swapType !== SwapType.CrossChainEvmToSolana
          ) {
            throw new Error("Interaction type mismatch");
          }
          draft.approvalTxIds = approvalResponses.map(({ hash }) => hash);
        });
        const swimUsdAccountAddress = findOrThrow(
          splTokenAccounts,
          ({ mint }) =>
            mint.toBase58() === getSolanaTokenDetails(swimUsd).address,
        ).address.toBase58();
        const crossChainInitiateRequest = await fromRouting.populateTransaction[
          "crossChainInitiate(address,uint256,uint256,uint16,bytes32,bytes16)"
        ](
          fromTokenDetails.address,
          atomicAmount,
          humanDecimalToAtomicString(
            firstMinimumOutputAmount,
            swimUsd,
            fromEcosystem,
          ),
          ecosystems[toEcosystem].wormholeChainId,
          new PublicKey(swimUsdAccountAddress).toBytes(),
          memo,
        );
        const crossChainInitiateResponse =
          await fromWallet.signer.sendTransaction(crossChainInitiateRequest);
        crossChainInitiateTxId = crossChainInitiateResponse.hash;
        updateInteractionState(interaction.id, (draft) => {
          if (
            draft.interactionType !== InteractionType.SwapV2 ||
            draft.swapType !== SwapType.CrossChainEvmToSolana
          ) {
            throw new Error("Interaction type mismatch");
          }
          draft.crossChainInitiateTxId = crossChainInitiateResponse.hash;
        });
      }
      const crossChainInitiateResponse =
        await evmClient.provider.getTransaction(crossChainInitiateTxId);
      const crossChainInitiateReceipt = await evmClient.getTxReceiptOrThrow(
        crossChainInitiateResponse,
      );
      const wormholeSequence = parseSequenceFromLogEth(
        crossChainInitiateReceipt,
        fromChainConfig.wormhole.bridge,
      );
      const auxiliarySigner = Keypair.generate();
      updateInteractionState(interaction.id, (draft) => {
        if (
          draft.interactionType !== InteractionType.SwapV2 ||
          draft.swapType !== SwapType.CrossChainEvmToSolana
        ) {
          throw new Error("Interaction type mismatch");
        }
        draft.signatureSetAddress = auxiliarySigner.publicKey.toBase58();
      });
      const { wormholeChainId: emitterChainId } = ecosystems[fromEcosystem];
      const retries = getWormholeRetries(emitterChainId);
      const { vaaBytes: vaa } = await getSignedVaaWithRetry(
        [...wormhole.rpcUrls],
        emitterChainId,
        getEmitterAddressEth(fromChainConfig.wormhole.portal),
        wormholeSequence,
        undefined,
        undefined,
        retries,
      );
      const unlockSplTokenTxIdsGenerator =
        solanaClient.generateCompleteWormholeTransferTxIds({
          interactionId: interaction.id,
          vaa,
          wallet: toWallet,
          auxiliarySigner,
        });
      let unlockSplTokenTxIds: readonly string[] = [];
      for await (const txId of unlockSplTokenTxIdsGenerator) {
        unlockSplTokenTxIds = [...unlockSplTokenTxIds, txId];
      }
      // Update transfer state with txId
      const postVaaOnSolanaTxIds = unlockSplTokenTxIds.slice(0, -1);
      const claimTokenOnSolanaTxId =
        unlockSplTokenTxIds[unlockSplTokenTxIds.length - 1];
      updateInteractionState(interaction.id, (draft) => {
        if (
          draft.interactionType !== InteractionType.SwapV2 ||
          draft.swapType !== SwapType.CrossChainEvmToSolana
        ) {
          throw new Error("Interaction type mismatch");
        }
        draft.postVaaOnSolanaTxIds = postVaaOnSolanaTxIds;
        draft.claimTokenOnSolanaTxId = claimTokenOnSolanaTxId;
      });

      if (!isSwimUsd(toTokenSpec)) {
        const solanaPool = findOrThrow(
          config.pools.filter(isSolanaPool),
          (pool) => pool.lpToken === swimUsd.id,
        );
        const operation: OperationSpec = {
          interactionId: interaction.id,
          poolId: solanaPool.id,
          instruction: SwimDefiInstruction.RemoveExactBurn,
          params: {
            exactBurnAmount: Amount.fromAtomicBn(
              swimUsd,
              BigInt("0x00"), // TODO: get claim swimUsd amount
              SOLANA_ECOSYSTEM_ID,
            ),
            outputTokenIndex: solanaPool.tokens.findIndex(
              (tokenId) => tokenId === toTokenData.tokenConfig.id,
            ),
            minimumOutputAmount: Amount.fromHuman(
              toTokenSpec,
              toTokenData.value,
            ),
          },
        };
        const txId = await doSingleSolanaPoolOperationV2({
          solanaClient,
          wallet: toWallet,
          splTokenAccounts,
          poolTokens: tokensByPoolId[solanaPool.id],
          poolSpec: solanaPool,
          operation,
          interactionId: interaction.id,
        });
        updateInteractionState(interaction.id, (draft) => {
          if (
            draft.interactionType !== InteractionType.SwapV2 ||
            draft.swapType !== SwapType.CrossChainEvmToSolana
          ) {
            throw new Error("Interaction type mismatch");
          }
          draft.swapFromSwimUsdTxId = txId;
        });
      }
    },
  );
};
