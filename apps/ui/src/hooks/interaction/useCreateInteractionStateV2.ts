import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import shallow from "zustand/shallow.js";

import { useSplTokenAccountsQuery, useWallets } from "..";
import type { PoolSpec, TokenSpec } from "../../config";
import {
  DEVNET_SWIMUSD,
  EcosystemId,
  findTokenById,
  getSolanaTokenDetails,
  isEvmEcosystemId,
} from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type {
  InteractionSpecV2,
  InteractionV2,
  RequiredSplTokenAccounts,
  SwapInteractionV2,
} from "../../models";
import {
  Amount,
  InteractionType,
  SwimDefiInstruction,
  findTokenAccountForMint,
  generateId,
  getConnectedWalletsV2,
  getRequiredPools,
} from "../../models";
import type { InteractionStateV2 } from "../../models/swim/interactionStateV2";
import { SwapType } from "../../models/swim/interactionStateV2";
import { filterMap } from "../../utils";

const getSwapType = (interaction: SwapInteractionV2): SwapType => {
  const { fromTokenDetail, toTokenDetail } = interaction.params;
  const fromEcosystem = fromTokenDetail.ecosystemId;
  const toEcosystem = toTokenDetail.ecosystemId;
  if (
    fromEcosystem === EcosystemId.Solana &&
    toEcosystem === EcosystemId.Solana
  ) {
    return SwapType.SingleChainSolana;
  }
  if (
    isEvmEcosystemId(fromEcosystem) &&
    isEvmEcosystemId(toEcosystem)
  ) {
    return fromEcosystem === toEcosystem
      ? SwapType.SingleChainEvm
      : SwapType.CrossChainEvmToEvm;
  }
  if (fromEcosystem === EcosystemId.Solana && isEvmEcosystemId(toEcosystem)) {
    return SwapType.CrossChainSolanaToEvm;
  }
  if (isEvmEcosystemId(fromEcosystem) && toEcosystem === EcosystemId.Solana) {
    return SwapType.CrossChainEvmToSolana;
  }

  throw new Error("Unknown swap type");
};

export const calculateRequiredSplTokenAccounts = (
  interaction: SwapInteractionV2,
  tokenAccounts: readonly TokenAccount[],
  walletAddress: string | null,
): RequiredSplTokenAccounts => {
  const swapType = getSwapType(interaction);
  if (
    swapType === SwapType.SingleChainEvm ||
    swapType === SwapType.CrossChainEvmToEvm
  ) {
    return {};
  }
  const { fromTokenDetail, toTokenDetail } = interaction.params;
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
    requiredTokens
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
  const swapType = getSwapType(interaction);
  const requiredSplTokenAccounts = calculateRequiredSplTokenAccounts(
    interaction,
    tokenAccounts,
    solanaWalletAddress,
  );
  switch (swapType) {
    case SwapType.SingleChainSolana: {
      const { fromTokenDetail, toTokenDetail } = interaction.params;
      const fromToken = findTokenById(fromTokenDetail.tokenId, interaction.env);
      const toToken = findTokenById(toTokenDetail.tokenId, interaction.env);
      if (requiredPools.length !== 1) {
        throw new Error("Single chain Solana Swap should only require 1 pool");
      }
      const poolSpec = requiredPools[0];
      return {
        interaction,
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
        swapType,
        approvalTxIds: [],
        onChainSwapTxId: null,
      };
    case SwapType.CrossChainEvmToEvm:
      return {
        interaction,
        swapType,
        approvalTxIds: [],
        swapAndTransferTxId: null,
        receiveAndSwapTxId: null,
      };
    case SwapType.CrossChainSolanaToEvm:
      return {
        interaction,
        swapType,
        requiredSplTokenAccounts,
        swapAndTransferTxId: null,
        receiveAndSwapTxId: null,
      };
    case SwapType.CrossChainEvmToSolana:
      return {
        interaction,
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
          approvalTxIds: [],
          removeTxId: null,
        };
      case InteractionType.Add:
        return {
          interaction,
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
