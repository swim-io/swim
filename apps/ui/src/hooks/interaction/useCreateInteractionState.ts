import type PoolMath from "@swim-io/pool-math";
import type { TokenAccount } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID, findTokenAccountForMint } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import { isEachNotNull } from "@swim-io/utils";
import type Decimal from "decimal.js";
import shallow from "zustand/shallow.js";

import type { Config, TokenConfig } from "../../config";
import { getSolanaTokenDetails } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type {
  Amount,
  FromSolanaTransferState,
  Interaction,
  InteractionSpec,
  InteractionState,
  RequiredSplTokenAccounts,
  SolanaPoolOperationState,
  ToSolanaTransferState,
} from "../../models";
import {
  InteractionType,
  createOperationSpecs,
  generateId,
  getConnectedWallets,
  getRequiredPools,
  getRequiredTokens,
  getTokensByPool,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useSolanaWallet, useSplTokenAccountsQuery } from "../solana";
import { usePoolMathByPoolIds } from "../swim";

export const createRequiredSplTokenAccounts = (
  requiredTokens: readonly TokenConfig[],
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
        txId: null,
      },
    };
  }, {});
};

const getToSolanaTransferAmounts = (
  interaction: Interaction,
): readonly Amount[] => {
  switch (interaction.type) {
    case InteractionType.Swap:
      return interaction.params.exactInputAmount.tokenConfig
        .nativeEcosystemId !== SOLANA_ECOSYSTEM_ID
        ? [interaction.params.exactInputAmount]
        : [];
    case InteractionType.Add:
      return interaction.params.inputAmounts.filter(
        (amount) =>
          amount.tokenConfig.nativeEcosystemId !== SOLANA_ECOSYSTEM_ID &&
          !amount.isZero(),
      );
    case InteractionType.RemoveExactBurn:
    case InteractionType.RemoveUniform:
      return interaction.lpTokenSourceEcosystem !== SOLANA_ECOSYSTEM_ID
        ? [interaction.params.exactBurnAmount]
        : [];
    case InteractionType.RemoveExactOutput:
      return interaction.lpTokenSourceEcosystem !== SOLANA_ECOSYSTEM_ID
        ? [interaction.params.maximumBurnAmount]
        : [];
  }
};

export const createToSolanaTransfers = (
  interaction: Interaction,
): readonly ToSolanaTransferState[] => {
  return getToSolanaTransferAmounts(interaction).map((amount) => {
    const fromToken = amount.tokenConfig;
    const fromEcosystem = fromToken.nativeEcosystemId;
    return {
      token: fromToken,
      value: amount.toHuman(fromEcosystem),
      signatureSetAddress: null,
      txIds: {
        approveAndTransferEvmToken: [],
        postVaaOnSolana: [],
        claimTokenOnSolana: null,
      },
    };
  });
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

const getFromSolanaTransferTokenAndValues = (
  interaction: Interaction,
): readonly {
  readonly token: TokenConfig;
  readonly value: Decimal | null;
}[] => {
  switch (interaction.type) {
    case InteractionType.Swap:
    case InteractionType.RemoveExactBurn:
      return interaction.params.minimumOutputAmount.tokenConfig
        .nativeEcosystemId !== SOLANA_ECOSYSTEM_ID
        ? [
            {
              token: interaction.params.minimumOutputAmount.tokenConfig,
              value: null,
            },
          ]
        : [];
    case InteractionType.Add:
      return interaction.lpTokenTargetEcosystem !== SOLANA_ECOSYSTEM_ID
        ? [
            {
              token: interaction.params.minimumMintAmount.tokenConfig,
              value: null,
            },
          ]
        : [];
    case InteractionType.RemoveUniform:
      return interaction.params.minimumOutputAmounts
        .filter(
          (amount) =>
            amount.tokenConfig.nativeEcosystemId !== SOLANA_ECOSYSTEM_ID,
        )
        .map((amount) => ({
          token: amount.tokenConfig,
          value: null,
        }));
    case InteractionType.RemoveExactOutput:
      return interaction.params.exactOutputAmounts
        .filter(
          (amount) =>
            amount.tokenConfig.nativeEcosystemId !== SOLANA_ECOSYSTEM_ID &&
            !amount.isZero(),
        )
        .map((amount) => ({
          token: amount.tokenConfig,
          value: amount.toHuman(amount.tokenConfig.nativeEcosystemId),
        }));
  }
};

export const createFromSolanaTransfers = (
  interaction: Interaction,
): readonly FromSolanaTransferState[] => {
  return getFromSolanaTransferTokenAndValues(interaction).map(
    ({ token, value }) => ({
      token,
      value,
      txIds: {
        transferSplToken: null,
        claimTokenOnEvm: null,
      },
    }),
  );
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
      connectedWallets,
    };
    return {
      version: undefined,
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
