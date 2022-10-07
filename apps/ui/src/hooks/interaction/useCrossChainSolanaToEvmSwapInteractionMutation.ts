import { getEmitterAddressSolana } from "@certusone/wormhole-sdk";
import type { Transaction } from "@solana/web3.js";
import {
  EVM_ECOSYSTEMS,
  evmAddressToWormhole,
  isEvmEcosystemId,
} from "@swim-io/evm";
import { Routing__factory } from "@swim-io/evm-contracts";
import {
  SOLANA_ECOSYSTEM_ID,
  findTokenAccountForMint,
  parseSequenceFromLogSolana,
} from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import { useMutation, useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import {
  Protocol,
  getTokenDetailsForEcosystem,
  getWormholeRetries,
  isSwimUsd,
} from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type {
  CrossChainSolanaToEvmSwapInteractionState,
  OperationSpec,
} from "../../models";
import {
  Amount,
  InteractionType,
  SwapType,
  SwimDefiInstruction,
  doSingleSolanaPoolOperationV2,
  findOrCreateSplTokenAccount,
  getSwimUsdBalanceChange,
  getTokensByPool,
  humanDecimalToAtomicString,
  isSolanaPool,
  transferFromSolanaToEvmWithSwimPayload,
} from "../../models";
import { getSignedVaaWithRetry } from "../../models/wormhole/guardiansRpc";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useSolanaClient, useSplTokenAccountsQuery } from "../solana";
import { useSwimUsd } from "../swim";

export const useCrossChainSolanaToEvmSwapInteractionMutation = () => {
  const queryClient = useQueryClient();
  const { updateInteractionState } = useInteractionStateV2();
  const { env } = useEnvironment();
  const config = useEnvironment(selectConfig, shallow);
  const { chains, wormhole, ecosystems, pools } = config;
  const solanaWormhole = chains[Protocol.Solana][0].wormhole;
  const wallets = useWallets();
  const solanaClient = useSolanaClient();
  const getEvmClient = useGetEvmClient();
  const { data: existingSplTokenAccounts = [] } = useSplTokenAccountsQuery();
  const swimUsd = useSwimUsd();
  const tokensByPoolId = getTokensByPool(config);

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
      const splTokenAccounts = await Promise.all(
        Object.keys(requiredSplTokenAccounts).map(async (mint) => {
          const { tokenAccount, creationTxId } =
            await findOrCreateSplTokenAccount({
              env,
              solanaClient,
              wallet: fromWallet,
              queryClient,
              splTokenMintAddress: mint,
              splTokenAccounts: existingSplTokenAccounts,
            });
          // Update interactionState
          if (creationTxId !== null) {
            updateInteractionState(interaction.id, (draft) => {
              if (
                draft.interactionType !== InteractionType.SwapV2 ||
                draft.swapType !== SwapType.CrossChainSolanaToEvm
              ) {
                throw new Error("Swap type mismatch");
              }
              draft.requiredSplTokenAccounts[mint].txId = creationTxId;
            });
          }
          return tokenAccount;
        }),
      );

      let { swapToSwimUsdTxId, transferSwimUsdToEvmTxId } = interactionState;
      if (!isSwimUsd(fromTokenSpec) && swapToSwimUsdTxId === null) {
        // Add fromToken to pool, get swimUsd
        const solanaPool = findOrThrow(
          pools.filter(isSolanaPool),
          (pool) => pool.lpToken === swimUsd.id,
        );
        const poolTokens = tokensByPoolId[solanaPool.id].tokens;
        const operation: OperationSpec = {
          interactionId: interaction.id,
          poolId: solanaPool.id,
          instruction: SwimDefiInstruction.Add,
          params: {
            inputAmounts: poolTokens.map((token) =>
              token.id === fromTokenSpec.id
                ? Amount.fromHuman(token, fromTokenData.value)
                : Amount.zero(token),
            ),
            minimumMintAmount: Amount.fromHuman(
              swimUsd,
              firstMinimumOutputAmount,
            ),
          },
        };
        swapToSwimUsdTxId = await doSingleSolanaPoolOperationV2({
          solanaClient,
          wallet: fromWallet,
          splTokenAccounts,
          poolTokens: tokensByPoolId[solanaPool.id],
          poolSpec: solanaPool,
          operation,
          interactionId: interaction.id,
        });
        updateInteractionState(interaction.id, (draft) => {
          if (
            draft.interactionType !== InteractionType.SwapV2 ||
            draft.swapType !== SwapType.CrossChainSolanaToEvm
          ) {
            throw new Error("Interaction type mismatch");
          }
          draft.swapToSwimUsdTxId = swapToSwimUsdTxId;
        });
      }
      if (transferSwimUsdToEvmTxId === null) {
        const swimUsdSplTokenAccount = findTokenAccountForMint(
          swimUsd.nativeDetails.address,
          fromWallet.address,
          splTokenAccounts,
        );
        if (swimUsdSplTokenAccount === null) {
          throw new Error("Missing SPL token account");
        }
        const transferValue =
          swapToSwimUsdTxId !== null
            ? await getSwimUsdBalanceChange(
                swapToSwimUsdTxId,
                solanaClient,
                swimUsdSplTokenAccount,
              )
            : fromTokenData.value;
        const { tx, messageKeypair } =
          await transferFromSolanaToEvmWithSwimPayload(
            interaction.id,
            solanaClient,
            solanaWormhole.bridge,
            solanaWormhole.portal,
            fromWallet.address,
            swimUsdSplTokenAccount.address.toBase58(),
            swimUsd.nativeDetails.address,
            BigInt(
              humanDecimalToAtomicString(
                transferValue,
                fromTokenSpec,
                fromTokenData.ecosystemId,
              ),
            ),
            evmAddressToWormhole(toChainConfig.routingContractAddress),
            evmAddressToWormhole(toWallet.address),
            ecosystems[toEcosystem].wormholeChainId,
          );
        transferSwimUsdToEvmTxId = await solanaClient.sendAndConfirmTx(
          async (txToSign: Transaction) => {
            txToSign.partialSign(messageKeypair);
            return fromWallet.signTransaction(txToSign);
          },
          tx,
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
      }

      const parsedTx = await solanaClient.getParsedTx(transferSwimUsdToEvmTxId);
      const sequence = parseSequenceFromLogSolana(parsedTx);
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
      const toTokenDetails = getTokenDetailsForEcosystem(
        toTokenSpec,
        toEcosystem,
      );
      if (toTokenDetails === null) {
        throw new Error("Missing token details");
      }
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
