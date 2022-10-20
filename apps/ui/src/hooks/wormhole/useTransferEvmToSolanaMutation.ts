import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import type { EvmTx } from "@swim-io/evm";
import { EvmTxType, isEvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID, solana } from "@swim-io/solana";
import { findOrThrow, humanToAtomic } from "@swim-io/utils";
import { WormholeChainId } from "@swim-io/wormhole";
import { useMutation, useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import { ECOSYSTEM_LIST, Protocol, getWormholeRetries } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { WormholeTransfer } from "../../models";
import {
  findOrCreateSplTokenAccount,
  formatWormholeAddress,
  getSignedVaaWithRetry,
  getWrappedTokenInfoFromNativeDetails,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useSolanaClient, useUserSolanaTokenAccountsQuery } from "../solana";

export const useTransferEvmToSolanaMutation = () => {
  const queryClient = useQueryClient();
  const { env } = useEnvironment();
  const { chains, wormhole } = useEnvironment(selectConfig, shallow);
  const getEvmClient = useGetEvmClient();
  const solanaClient = useSolanaClient();
  const wallets = useWallets();
  const solanaWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;
  const { data: splTokenAccounts = [] } = useUserSolanaTokenAccountsQuery();

  return useMutation(
    async ({
      interactionId,
      value,
      sourceDetails,
      targetDetails,
      nativeDetails,
      onTxResult,
    }: WormholeTransfer) => {
      if (!wormhole) {
        throw new Error("No Wormhole RPC configured");
      }
      if (!solanaWallet) {
        throw new Error("No Solana wallet");
      }
      if (targetDetails.chainId !== WormholeChainId.Solana) {
        throw new Error("Invalid target chain");
      }

      const evmEcosystem = findOrThrow(
        ECOSYSTEM_LIST,
        (ecosystem) => ecosystem.wormholeChainId === sourceDetails.chainId,
      );
      const evmEcosystemId = evmEcosystem.id;
      if (!isEvmEcosystemId(evmEcosystemId)) {
        throw new Error("Invalid EVM chain");
      }
      const evmChain = findOrThrow(
        chains[Protocol.Evm],
        ({ ecosystem }) => ecosystem === evmEcosystemId,
      );
      const evmClient = getEvmClient(evmEcosystemId);
      const evmWallet = wallets[evmEcosystemId].wallet;
      if (!evmWallet) {
        throw new Error("Missing EVM wallet");
      }

      const { tokenAccount, creationTxId } = await findOrCreateSplTokenAccount({
        env,
        solanaClient,
        wallet: solanaWallet,
        queryClient,
        splTokenMintAddress: targetDetails.address,
        splTokenAccounts,
      });
      const splTokenAccountAddress = tokenAccount.address.toBase58();
      if (creationTxId) {
        onTxResult({
          chainId: targetDetails.chainId,
          txId: creationTxId,
        });
      }

      await evmWallet.switchNetwork(evmChain.chainId);
      // Process transfer if transfer txId does not exist
      const evmTxGenerator = evmClient.generateInitiatePortalTransferTxs({
        atomicAmount: humanToAtomic(value, sourceDetails.decimals).toString(),
        interactionId,
        sourceAddress: sourceDetails.address,
        targetAddress: formatWormholeAddress(
          Protocol.Solana,
          splTokenAccountAddress,
        ),
        targetChainId: solana.wormholeChainId,
        wallet: evmWallet,
        wrappedTokenInfo: getWrappedTokenInfoFromNativeDetails(
          sourceDetails.chainId,
          nativeDetails,
        ),
      });

      let evmTransferTx: EvmTx | null = null;
      for await (const result of evmTxGenerator) {
        if (result.type === EvmTxType.PortalTransferTokens) {
          evmTransferTx = result.tx;
        }
        onTxResult({
          chainId: sourceDetails.chainId,
          txId: result.tx.id,
        });
      }

      if (evmTransferTx === null) {
        throw new Error("Missing EVM transaction");
      }

      const sequence = parseSequenceFromLogEth(
        evmTransferTx.original,
        evmChain.wormhole.bridge,
      );

      const auxiliarySigner = Keypair.generate();
      const retries = getWormholeRetries(evmEcosystem.wormholeChainId);
      const { vaaBytes: vaa } = await getSignedVaaWithRetry(
        [...wormhole.rpcUrls],
        evmEcosystem.wormholeChainId,
        getEmitterAddressEth(evmChain.wormhole.portal),
        sequence,
        undefined,
        undefined,
        retries,
      );
      const splTxGenerator = solanaClient.generateCompletePortalTransferTxs({
        interactionId,
        vaa,
        wallet: solanaWallet,
        auxiliarySigner,
      });

      for await (const result of splTxGenerator) {
        onTxResult({
          chainId: targetDetails.chainId,
          txId: result.tx.id,
        });
      }
    },
  );
};
