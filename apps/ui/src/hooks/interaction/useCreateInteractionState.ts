import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type PoolMath from "@swim-io/pool-math";
import shallow from "zustand/shallow.js";

import { usePoolMathByPoolIds, useSplTokenAccountsQuery, useWallets } from "..";
import type { Config, TokenSpec } from "../../config";
import {
  EcosystemId,
  getSolanaTokenDetails,
  isEvmEcosystemId,
} from "../../config";
import { useSolanaWallet } from "../../contexts";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import {
  InteractionType,
  createOperationSpecs,
  findTokenAccountForMint,
  generateId,
  getConnectedWallets,
  getRequiredPools,
  getRequiredTokens,
  getTokensByPool,
} from "../../models";
import type {
  FromSolanaTransferState,
  Interaction,
  InteractionSpec,
  InteractionState,
  RequiredSplTokenAccounts,
  SolanaPoolOperationState,
  ToSolanaTransferState,
} from "../../models";
import type { ReadonlyRecord } from "../../utils";
import { isEachNotNull } from "../../utils";

export const createRequiredSplTokenAccounts = (
  requiredTokens: readonly TokenSpec[],
  tokenAccounts: readonly TokenAccount[],
  walletAddress: string | null,
): RequiredSplTokenAccounts => {
  const mints = requiredTokens.map(
    (token) => getSolanaTokenDetails(token).address,
  );
  if (walletAddress === null) {
    throw new Error("No Solana wallet address found");
  }

  return mints.reduce((state, mint) => {
    const accountForMint = findTokenAccountForMint(
      mint,
      walletAddress,
      tokenAccounts,
    );
    return {
      ...state,
      [mint]: {
        isExistingAccount: accountForMint !== null,
        account: accountForMint,
        txId: null,
      },
    };
  }, {});
};

export const createToSolanaTransfers = (
  interaction: Interaction,
): readonly ToSolanaTransferState[] => {
  // Only for swap at the moment
  if (interaction.type !== InteractionType.Swap) {
    return [];
  }
  const {
    params: { exactInputAmount },
  } = interaction;
  const fromToken = exactInputAmount.tokenSpec;
  const fromEcosystem = fromToken.nativeEcosystem;
  // No ToSolanaTransfer if fromToken is not Evm
  if (!isEvmEcosystemId(fromEcosystem)) {
    return [];
  }
  return [
    {
      token: fromToken,
      value: exactInputAmount.toHuman(fromEcosystem),
      txIds: {
        approveAndTransferEvmToken: [],
        postVaaOnSolana: [],
        claimTokenOnSolana: null,
      },
    },
  ];
};

export const createSolanaPoolOperations = (
  interaction: Interaction,
  config: Config,
  poolMathsByPoolId: ReadonlyRecord<string, PoolMath | null>,
): readonly SolanaPoolOperationState[] => {
  const tokensByPoolId = getTokensByPool(config);
  const requiredPools = getRequiredPools(config.pools, interaction);
  const poolMaths = requiredPools.map(({ id }) => poolMathsByPoolId[id]);

  if (!isEachNotNull(poolMaths)) {
    throw new Error("Required pool math not available");
  }

  const operationSpecs = createOperationSpecs(
    tokensByPoolId,
    requiredPools,
    poolMaths,
    interaction,
  );
  return operationSpecs.map((operation) => ({
    operation,
    txId: null,
  }));
};

export const createFromSolanaTransfers = (
  interaction: Interaction,
): readonly FromSolanaTransferState[] => {
  // Only for swap at the moment
  if (interaction.type !== InteractionType.Swap) {
    return [];
  }
  const {
    params: { minimumOutputAmount },
  } = interaction;
  const toToken = minimumOutputAmount.tokenSpec;
  // No WormholeFromSolana if toToken is Solana
  if (toToken.nativeEcosystem === EcosystemId.Solana) {
    return [];
  }
  return [
    {
      token: toToken,
      value: null,
      txIds: {
        transferSplToken: null,
        claimTokenOnEvm: null,
      },
    },
  ];
};

export const useCreateInteractionState = () => {
  const config = useEnvironment(selectConfig, shallow);
  const wallets = useWallets();
  const { env } = useEnvironment();
  const tokensByPoolId = getTokensByPool(config);
  const { data: tokenAccounts = [] } = useSplTokenAccountsQuery();
  const { address: walletAddress } = useSolanaWallet();
  const poolMathsByPoolId = usePoolMathByPoolIds();

  return (interactionSpec: InteractionSpec): InteractionState => {
    const requiredPools = getRequiredPools(config.pools, interactionSpec);
    const requiredTokens = getRequiredTokens(
      tokensByPoolId,
      requiredPools,
      interactionSpec,
    );
    const connectedWallets = getConnectedWallets(
      config.tokens,
      interactionSpec,
      wallets,
    );
    const interaction = {
      ...interactionSpec,
      id: generateId(),
      poolIds: requiredPools.map((pool) => pool.id),
      env,
      submittedAt: Date.now(),
      signatureSetKeypairs: {},
      previousSignatureSetAddresses: {},
      connectedWallets,
    };
    return {
      interaction,
      requiredSplTokenAccounts: createRequiredSplTokenAccounts(
        requiredTokens,
        tokenAccounts,
        walletAddress,
      ),
      toSolanaTransfers: createToSolanaTransfers(interaction),
      solanaPoolOperations: createSolanaPoolOperations(
        interaction,
        config,
        poolMathsByPoolId,
      ),
      fromSolanaTransfers: createFromSolanaTransfers(interaction),
    };
  };
};
