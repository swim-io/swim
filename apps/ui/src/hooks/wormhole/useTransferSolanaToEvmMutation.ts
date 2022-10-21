import { getEmitterAddressSolana } from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import { isEvmEcosystemId } from "@swim-io/evm";
import type { SolanaTx } from "@swim-io/solana";
import {
  SOLANA_ECOSYSTEM_ID,
  parseSequenceFromLogSolana,
  solana,
} from "@swim-io/solana";
import { findOrThrow, humanToAtomic } from "@swim-io/utils";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import { ECOSYSTEM_LIST, Protocol, getWormholeRetries } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { WormholeTransfer } from "../../models";
import {
  formatWormholeAddress,
  getSignedVaaWithRetry,
  getWrappedTokenInfoFromNativeDetails,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useSolanaClient } from "../solana";

export const useTransferSolanaToEvmMutation = () => {
  const { chains, wormhole } = useEnvironment(selectConfig, shallow);
  const [solanaChain] = chains[Protocol.Solana];
  const getEvmClient = useGetEvmClient();
  const solanaClient = useSolanaClient();
  const wallets = useWallets();
  const solanaWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;

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
      const solanaWalletAddress = solanaWallet.address ?? null;
      if (!solanaWalletAddress) {
        throw new Error("No Solana wallet address");
      }

      const evmEcosystem = findOrThrow(
        ECOSYSTEM_LIST,
        (ecosystem) => ecosystem.wormholeChainId === targetDetails.chainId,
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
        throw new Error("No EVM wallet");
      }
      const evmWalletAddress = evmWallet.address;
      if (evmWalletAddress === null) {
        throw new Error("No EVM wallet address");
      }

      const auxiliarySigner = Keypair.generate();
      const solanaTxGenerator = solanaClient.generateInitiatePortalTransferTxs({
        atomicAmount: humanToAtomic(value, sourceDetails.decimals).toString(),
        interactionId,
        sourceAddress: sourceDetails.address,
        targetAddress: formatWormholeAddress(Protocol.Evm, evmWalletAddress),
        targetChainId: evmEcosystem.wormholeChainId,
        wallet: solanaWallet,
        auxiliarySigner,
        wrappedTokenInfo: getWrappedTokenInfoFromNativeDetails(
          sourceDetails.chainId,
          nativeDetails,
        ),
      });

      let solanaTx: SolanaTx | null = null;
      for await (const result of solanaTxGenerator) {
        solanaTx = result.tx;
        onTxResult({
          chainId: sourceDetails.chainId,
          txId: result.tx.id,
        });
      }
      if (solanaTx === null) {
        throw new Error("Missing Solana transaction");
      }

      const sequence = parseSequenceFromLogSolana(solanaTx.original);
      const emitterAddress = await getEmitterAddressSolana(
        solanaChain.wormhole.portal,
      );
      const retries = getWormholeRetries(solana.wormholeChainId);
      const { vaaBytes: vaa } = await getSignedVaaWithRetry(
        [...wormhole.rpcUrls],
        sourceDetails.chainId,
        emitterAddress,
        sequence,
        undefined,
        undefined,
        retries,
      );
      await evmWallet.switchNetwork(evmChain.chainId);
      const evmTxGenerator = evmClient.generateCompletePortalTransferTxs({
        interactionId,
        vaa,
        wallet: evmWallet,
      });

      for await (const result of evmTxGenerator) {
        onTxResult({
          chainId: targetDetails.chainId,
          txId: result.tx.id,
        });
      }
    },
  );
};
