import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import shallow from "zustand/shallow.js";

import type { PoolSpec, TokenSpec } from "../../config";
import {
  DEVNET_SWIMUSD,
  EcosystemId,
  findTokenById,
  getSolanaTokenDetails,
} from "../../config";
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
} from "../../models";
import {
  Amount,
  InteractionType,
  SwapType,
  SwimDefiInstruction,
  findTokenAccountForMint,
  generateId,
  getConnectedWalletsV2,
  getRequiredPools,
  getSwapType,
} from "../../models";
import { filterMap } from "../../utils";
import { useWallets } from "../crossEcosystem";
import { useSplTokenAccountsQuery } from "../solana";

export const calculateRequiredSplTokenAccounts = (
  interaction: SwapInteractionV2,
  tokenAccounts: readonly TokenAccount[],
  walletAddress: string | null,
): RequiredSplTokenAccounts => {
  const { fromTokenDetail, toTokenDetail } = interaction.params;
  const swapType = getSwapType(fromTokenDetail, toTokenDetail);
  if (
    swapType === SwapType.SingleChainEvm ||
    swapType === SwapType.CrossChainEvmToEvm
  ) {
    return {};
  }

  const fromToken = findTokenById(fromTokenDetail.tokenId, interaction.env);
  const toToken = findTokenById(toTokenDetail.tokenId, interaction.env);
  // TODO: Find a better way to get swimUSD per env
  const swimUSD = DEVNET_SWIMUSD;

  const isCrossChain =
    swapType === SwapType.CrossChainSolanaToEvm ||
    swapType === SwapType.CrossChainEvmToSolana;
  const requiredTokens = isCrossChain
    ? [fromToken, toToken, swimUSD]
    : [fromToken, toToken];
  const mints = filterMap(
    (token: TokenSpec) => token.nativeEcosystem === EcosystemId.Solana,
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

export const calculateRequiredSplTokenAccountsForAddRemove = (
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
    interaction.lpTokenTargetEcosystem !== EcosystemId.Solana
  )
    return null;

  if (
    interaction.type !== InteractionType.Add &&
    interaction.lpTokenSourceEcosystem !== EcosystemId.Solana
  )
    return null;

  const requiredTokens: readonly TokenSpec[] = (() => {
    switch (interaction.type) {
      case InteractionType.Add: {
        return [
          ...interaction.params.inputAmounts,
          interaction.params.minimumMintAmount,
        ].map((amount) => amount.tokenSpec);
      }
      case InteractionType.RemoveExactBurn:
        return [
          interaction.params.exactBurnAmount,
          interaction.params.minimumOutputAmount,
        ].map((amount) => amount.tokenSpec);
      case InteractionType.RemoveExactOutput:
        return [
          ...interaction.params.exactOutputAmounts,
          interaction.params.maximumBurnAmount,
        ].map((amount) => amount.tokenSpec);
      case InteractionType.RemoveUniform:
        return [
          ...interaction.params.minimumOutputAmounts,
          interaction.params.exactBurnAmount,
        ].map((amount) => amount.tokenSpec);
    }
  })();
  const mints = filterMap(
    (token: TokenSpec) => token.nativeEcosystem === EcosystemId.Solana,
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
  requiredPools: readonly PoolSpec[],
): InteractionStateV2 => {
  const { fromTokenDetail, toTokenDetail } = interaction.params;
  const swapType = getSwapType(fromTokenDetail, toTokenDetail);
  const requiredSplTokenAccounts = calculateRequiredSplTokenAccounts(
    interaction,
    tokenAccounts,
    solanaWalletAddress,
  );
  switch (swapType) {
    case SwapType.SingleChainSolana: {
      const fromToken = findTokenById(fromTokenDetail.tokenId, interaction.env);
      const toToken = findTokenById(toTokenDetail.tokenId, interaction.env);
      if (requiredPools.length !== 1) {
        throw new Error("Single chain Solana Swap should only require 1 pool");
      }
      const poolSpec = requiredPools[0];
      return {
        interaction,
        interactionType: interaction.type,
        swapType,
        requiredSplTokenAccounts,
        solanaPoolOperations: [
          {
            operation: {
              interactionId: interaction.id,
              poolId: poolSpec.id,
              instruction: SwimDefiInstruction.Swap,
              params: {
                exactInputAmounts: [
                  Amount.fromHuman(fromToken, fromTokenDetail.value),
                ],
                outputTokenIndex: poolSpec.tokens.findIndex(
                  (tokenId) => tokenId === toTokenDetail.tokenId,
                ),
                minimumOutputAmount: Amount.fromHuman(
                  toToken,
                  toTokenDetail.value,
                ),
              },
            },
            txId: null,
          },
        ],
      };
    }
    case SwapType.SingleChainEvm:
      return {
        interaction,
        interactionType: interaction.type,
        swapType,
        approvalTxIds: [],
        onChainSwapTxId: null,
      };
    case SwapType.CrossChainEvmToEvm:
      return {
        interaction,
        interactionType: interaction.type,
        swapType,
        approvalTxIds: [],
        swapAndTransferTxId: null,
        receiveAndSwapTxId: null,
      };
    case SwapType.CrossChainSolanaToEvm:
      return {
        interaction,
        interactionType: interaction.type,
        swapType,
        requiredSplTokenAccounts,
        swapAndTransferTxId: null,
        receiveAndSwapTxId: null,
      };
    case SwapType.CrossChainEvmToSolana:
      return {
        interaction,
        interactionType: interaction.type,
        swapType,
        requiredSplTokenAccounts,
        approvalTxIds: [],
        swapAndTransferTxId: null,
        postVaaOnSolanaTxIds: [],
        claimTokenOnSolanaTxId: null,
      };
  }
};

export const useCreateInteractionStateV2 = () => {
  const config = useEnvironment(selectConfig, shallow);
  const wallets = useWallets();
  const { env } = useEnvironment();
  const { data: tokenAccounts = [] } = useSplTokenAccountsQuery();
  const solanaWalletAddress = wallets[EcosystemId.Solana].address;

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
      case InteractionType.SwapV2:
        return createSwapInteractionState(
          interaction,
          tokenAccounts,
          solanaWalletAddress,
          requiredPools,
        );
      default:
        throw new Error("Unsupported interaction type");
    }
  };
};
