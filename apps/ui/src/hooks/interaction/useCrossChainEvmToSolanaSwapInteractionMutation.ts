import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import { getTokenDetails } from "@swim-io/core";
import { EVM_ECOSYSTEMS, isEvmEcosystemId } from "@swim-io/evm";
import { Routing__factory } from "@swim-io/evm-contracts";
import {
  SOLANA_ECOSYSTEM_ID,
  SolanaTxType,
  findTokenAccountForMint,
} from "@swim-io/solana";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { useMutation, useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import { getWormholeRetries } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type { CrossChainEvmToSolanaSwapInteractionState } from "../../models";
import {
  InteractionType,
  SwapType,
  findOrCreateSplTokenAccount,
  getSignedVaaWithRetry,
  humanDecimalToAtomicString,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useSolanaClient, useUserSolanaTokenAccountsQuery } from "../solana";
import { useSwimUsd } from "../swim";

export const useCrossChainEvmToSolanaSwapInteractionMutation = () => {
  const queryClient = useQueryClient();
  const { data: existingSplTokenAccounts = [] } =
    useUserSolanaTokenAccountsQuery();
  const { updateInteractionState } = useInteractionStateV2();
  const wallets = useWallets();
  const solanaClient = useSolanaClient();
  const getEvmClient = useGetEvmClient();
  const { env } = useEnvironment();
  const config = useEnvironment(selectConfig, shallow);
  const { ecosystems, wormhole } = config;
  const swimUsd = useSwimUsd();

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
      if (
        toWallet === null ||
        toWallet.address === null ||
        toWallet.publicKey === null
      ) {
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
      const memo = Buffer.from(interaction.id, "hex");
      let crossChainInitiateTxId = interactionState.crossChainInitiateTxId;
      if (crossChainInitiateTxId === null) {
        const atomicAmount = humanDecimalToAtomicString(
          fromTokenData.value,
          fromTokenData.tokenConfig,
          fromTokenData.ecosystemId,
        );
        const approveTxGenerator = evmClient.generateErc20ApproveTxs({
          atomicAmount,
          wallet: fromWallet,
          mintAddress: fromTokenDetails.address,
          spenderAddress: fromChainConfig.routingContractAddress,
        });
        for await (const result of approveTxGenerator) {
          updateInteractionState(interaction.id, (draft) => {
            if (
              draft.interactionType !== InteractionType.SwapV2 ||
              draft.swapType !== SwapType.CrossChainEvmToSolana
            ) {
              throw new Error("Interaction type mismatch");
            }
            draft.approvalTxIds.push(result.tx.id);
          });
        }
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
          toWallet.publicKey.toBytes(),
          memo,
        );
        await fromWallet.switchNetwork(fromChainConfig.chainId);
        const crossChainInitiateResponse =
          await fromWallet.signer.sendTransaction(crossChainInitiateRequest);
        const crossChainInitiateTx = await evmClient.getTx(
          crossChainInitiateResponse,
        );
        crossChainInitiateTxId = crossChainInitiateTx.id;
        updateInteractionState(interaction.id, (draft) => {
          if (
            draft.interactionType !== InteractionType.SwapV2 ||
            draft.swapType !== SwapType.CrossChainEvmToSolana
          ) {
            throw new Error("Interaction type mismatch");
          }
          draft.crossChainInitiateTxId = crossChainInitiateTx.id;
        });
      }
      const crossChainInitiateTx = await evmClient.getTx(
        crossChainInitiateTxId,
      );
      const wormholeSequence = parseSequenceFromLogEth(
        crossChainInitiateTx.original,
        fromChainConfig.wormhole.bridge,
      );
      const { wormholeChainId: emitterChainId } = ecosystems[fromEcosystem];
      const retries = getWormholeRetries(emitterChainId);
      const { vaaBytes: signedVaa } = await getSignedVaaWithRetry(
        [...wormhole.rpcUrls],
        emitterChainId,
        getEmitterAddressEth(fromChainConfig.wormhole.portal),
        wormholeSequence,
        undefined,
        undefined,
        retries,
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
      const swimUsdAccount = findTokenAccountForMint(
        swimUsd.nativeDetails.address,
        toWallet.address,
        splTokenAccounts,
      );
      if (swimUsdAccount === null) {
        throw new Error("SwimUsd account not found");
      }
      if (interactionState.postVaaOnSolanaTxId === null) {
        const auxiliarySigner = Keypair.generate();
        const postVaaTxGenerator =
          solanaClient.generateCompleteWormholeMessageTxs({
            interactionId: interaction.id,
            vaa: signedVaa,
            wallet: toWallet,
            auxiliarySigner,
          });
        for await (const result of postVaaTxGenerator) {
          updateInteractionState(interaction.id, (draft) => {
            if (
              draft.interactionType !== InteractionType.SwapV2 ||
              draft.swapType !== SwapType.CrossChainEvmToSolana
            ) {
              throw new Error("Interaction type mismatch");
            }

            switch (result.type) {
              case SolanaTxType.WormholeVerifySignatures:
                draft.verifySignaturesTxIds.push(result.tx.id);
                break;
              case SolanaTxType.WormholePostVaa:
                draft.postVaaOnSolanaTxId = result.tx.id;
                draft.auxiliarySignerPublicKey =
                  auxiliarySigner.publicKey.toBase58();
                break;
              default:
                throw new Error(`Unexpected transaction type: ${result.tx.id}`);
            }
          });
        }
      }
      const tokenProject = TOKEN_PROJECTS_BY_ID[toTokenSpec.projectId];
      if (tokenProject.tokenNumber === null) {
        throw new Error(`Token number for ${tokenProject.symbol} not found`);
      }
      const minimumOutputAmount = humanDecimalToAtomicString(
        toTokenData.value,
        toTokenData.tokenConfig,
        toTokenData.ecosystemId,
      );
      const completeTransferTxGenerator =
        solanaClient.generateCompleteSwimSwapTxs({
          wallet: toWallet,
          interactionId: interaction.id,
          signedVaa: Buffer.from(signedVaa),
          sourceChainConfig: fromChainConfig,
          sourceWormholeChainId: ecosystems[fromEcosystem].wormholeChainId,
          targetTokenNumber: tokenProject.tokenNumber,
          minimumOutputAmount,
        });
      for await (const result of completeTransferTxGenerator) {
        updateInteractionState(interaction.id, (draft) => {
          if (
            draft.interactionType !== InteractionType.SwapV2 ||
            draft.swapType !== SwapType.CrossChainEvmToSolana
          ) {
            throw new Error("Interaction type mismatch");
          }
          switch (result.type) {
            case SolanaTxType.SwimCompleteNativeWithPayload:
              draft.completeNativeWithPayloadTxId = result.tx.id;
              break;
            case SolanaTxType.SwimProcessSwimPayload:
              draft.processSwimPayloadTxId = result.tx.id;
              break;
            default:
              throw new Error(`Unexpected transaction type: ${result.tx.id}`);
          }
        });
      }
    },
  );
};
