import type { TokenAccount } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID, findTokenAccountForMint } from "@swim-io/solana";
import { filterMap } from "@swim-io/utils";
import shallow from "zustand/shallow.js";

import type { TokenConfig } from "../../config";
import { getSolanaTokenDetails } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type {
  AddInteraction,
  InteractionSpecV2,
  InteractionStateV2,
  InteractionV2,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  RequiredSplTokenAccounts,
  SwapInteractionV2,
  TokensByPoolId,
} from "../../models";
import {
  InteractionType,
  SwapType,
  generateId,
  getConnectedWalletsV2,
  getRequiredPools,
  getSwapType,
  getTokensByPool,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useUserSolanaTokenAccountsQuery } from "../solana";

const calculateRequiredSplTokenAccounts = (
  interaction: SwapInteractionV2,
  tokenAccounts: readonly TokenAccount[],
  walletAddress: string | null,
  solanaPoolTokens: TokensByPoolId[string],
): RequiredSplTokenAccounts => {
  const { fromTokenData, toTokenData } = interaction.params;
  const swapType = getSwapType(fromTokenData, toTokenData);
  if (
    swapType === SwapType.SingleChainEvm ||
    swapType === SwapType.CrossChainEvmToEvm
  ) {
    return {};
  }
  const swimUsd = solanaPoolTokens.lpToken;
  const requiredSwimUsd =
    swapType === SwapType.CrossChainSolanaToEvm ||
    swapType === SwapType.CrossChainEvmToSolana ||
    fromTokenData.tokenConfig.id === swimUsd.id ||
    toTokenData.tokenConfig.id === swimUsd.id;
  const requiredTokens = requiredSwimUsd
    ? new Set([...solanaPoolTokens.tokens, swimUsd])
    : new Set([...solanaPoolTokens.tokens]);
  const mints = filterMap(
    (token: TokenConfig) => token.nativeEcosystemId === SOLANA_ECOSYSTEM_ID,
    (token) => getSolanaTokenDetails(token).address,
    Array.from(requiredTokens),
  );
  if (walletAddress === null) {
    throw new Error("No Solana wallet address found");
  }
  return mints.reduce((requiredAccounts, mint) => {
    const accountForMint = findTokenAccountForMint(
      mint,
      walletAddress,
      tokenAccounts,
    );
    return {
      ...requiredAccounts,
      [mint]: {
        isExistingAccount: accountForMint !== null,
        txId: null,
      },
    };
  }, {});
};

const calculateRequiredSplTokenAccountsForAddRemove = (
  interaction:
    | AddInteraction
    | RemoveUniformInteraction
    | RemoveExactBurnInteraction
    | RemoveExactOutputInteraction,
  tokenAccounts: readonly TokenAccount[],
  walletAddress: string | null,
): RequiredSplTokenAccounts | null => {
  if (
    interaction.type === InteractionType.Add &&
    interaction.lpTokenTargetEcosystem !== SOLANA_ECOSYSTEM_ID
  )
    return null;

  if (
    interaction.type !== InteractionType.Add &&
    interaction.lpTokenSourceEcosystem !== SOLANA_ECOSYSTEM_ID
  )
    return null;

  const requiredTokens: readonly TokenConfig[] = (() => {
    switch (interaction.type) {
      case InteractionType.Add: {
        return [
          ...interaction.params.inputAmounts,
          interaction.params.minimumMintAmount,
        ].map((amount) => amount.tokenConfig);
      }
      case InteractionType.RemoveExactBurn:
        return [
          interaction.params.exactBurnAmount,
          interaction.params.minimumOutputAmount,
        ].map((amount) => amount.tokenConfig);
      case InteractionType.RemoveExactOutput:
        return [
          ...interaction.params.exactOutputAmounts,
          interaction.params.maximumBurnAmount,
        ].map((amount) => amount.tokenConfig);
      case InteractionType.RemoveUniform:
        return [
          ...interaction.params.minimumOutputAmounts,
          interaction.params.exactBurnAmount,
        ].map((amount) => amount.tokenConfig);
    }
  })();
  const mints = filterMap(
    (token: TokenConfig) => token.nativeEcosystemId === SOLANA_ECOSYSTEM_ID,
    (token) => getSolanaTokenDetails(token).address,
    requiredTokens,
  );
  if (walletAddress === null) {
    throw new Error("No Solana wallet address found");
  }
  return mints.reduce((requiredAccounts, mint) => {
    const accountForMint = findTokenAccountForMint(
      mint,
      walletAddress,
      tokenAccounts,
    );
    return {
      ...requiredAccounts,
      [mint]: {
        isExistingAccount: accountForMint !== null,
        txId: null,
      },
    };
  }, {});
};

const createSwapInteractionState = (
  interaction: SwapInteractionV2,
  tokenAccounts: readonly TokenAccount[],
  solanaWalletAddress: string | null,
  solanaPoolTokens: TokensByPoolId[string],
): InteractionStateV2 => {
  const { fromTokenData, toTokenData } = interaction.params;
  const swapType = getSwapType(fromTokenData, toTokenData);
  const requiredSplTokenAccounts = calculateRequiredSplTokenAccounts(
    interaction,
    tokenAccounts,
    solanaWalletAddress,
    solanaPoolTokens,
  );
  switch (swapType) {
    case SwapType.SingleChainSolana: {
      return {
        version: 2,
        interaction,
        interactionType: interaction.type,
        swapType,
        requiredSplTokenAccounts,
        onChainSwapTxId: null,
      };
    }
    case SwapType.SingleChainEvm:
      return {
        version: 2,
        interaction,
        interactionType: interaction.type,
        swapType,
        approvalTxIds: [],
        onChainSwapTxId: null,
      };
    case SwapType.CrossChainEvmToEvm:
      return {
        version: 2,
        interaction,
        interactionType: interaction.type,
        swapType,
        approvalTxIds: [],
        crossChainInitiateTxId: null,
        crossChainCompleteTxId: null,
      };
    case SwapType.CrossChainSolanaToEvm:
      return {
        version: 2,
        interaction,
        interactionType: interaction.type,
        swapType,
        requiredSplTokenAccounts,
        swapToSwimUsdTxId: null,
        transferSwimUsdToEvmTxId: null,
        crossChainCompleteTxId: null,
      };
    case SwapType.CrossChainEvmToSolana:
      return {
        version: 2,
        interaction,
        interactionType: interaction.type,
        swapType,
        requiredSplTokenAccounts,
        approvalTxIds: [],
        crossChainInitiateTxId: null,
        auxiliarySignerPublicKey: null,
        verifySignatureTxId: null,
        postVaaOnSolanaTxId: null,
        completeNativeWithPayloadTxId: null,
        processSwimPayloadTxId: null,
      };
  }
};

export const useCreateInteractionStateV2 = () => {
  const config = useEnvironment(selectConfig, shallow);
  const wallets = useWallets();
  const { env } = useEnvironment();
  const { data: tokenAccounts = [] } = useUserSolanaTokenAccountsQuery();
  const solanaWalletAddress = wallets[SOLANA_ECOSYSTEM_ID].address;
  const tokensByPoolId = getTokensByPool(config);

  return (interactionSpec: InteractionSpecV2): InteractionStateV2 => {
    const requiredPools = getRequiredPools(config.pools, interactionSpec);
    const connectedWallets = getConnectedWalletsV2(
      interactionSpec,
      config.pools,
      wallets,
    );
    const interaction: InteractionV2 = {
      ...interactionSpec,
      id: generateId(),
      poolIds: requiredPools.map((pool) => pool.id),
      env,
      submittedAt: Date.now(),
      connectedWallets,
    };

    switch (interaction.type) {
      case InteractionType.RemoveExactBurn:
      case InteractionType.RemoveExactOutput:
      case InteractionType.RemoveUniform:
        return {
          version: 2,
          interaction,
          interactionType: interaction.type,
          requiredSplTokenAccounts:
            calculateRequiredSplTokenAccountsForAddRemove(
              interaction,
              tokenAccounts,
              solanaWalletAddress,
            ),
          approvalTxIds: [],
          removeTxId: null,
        };
      case InteractionType.Add:
        return {
          version: 2,
          interaction,
          interactionType: interaction.type,
          requiredSplTokenAccounts:
            calculateRequiredSplTokenAccountsForAddRemove(
              interaction,
              tokenAccounts,
              solanaWalletAddress,
            ),
          approvalTxIds: [],
          addTxId: null,
        };
      case InteractionType.SwapV2: {
        const solanaTwoPool = config.pools.find(
          (pool) =>
            pool.ecosystem === SOLANA_ECOSYSTEM_ID && !pool.isLegacyPool,
        );
        if (!solanaTwoPool) {
          throw new Error("Solana two pool not found");
        }
        return createSwapInteractionState(
          interaction,
          tokenAccounts,
          solanaWalletAddress,
          tokensByPoolId[solanaTwoPool.id],
        );
      }
      default:
        throw new Error("Unsupported interaction type");
    }
  };
};
