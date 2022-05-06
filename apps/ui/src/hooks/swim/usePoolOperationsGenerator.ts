import type { AccountInfo as TokenAccount } from "@solana/spl-token";

import type { Env, PoolSpec } from "../../config";
import { EcosystemId, getSolanaTokenDetails } from "../../config";
import {
  useEnvironment,
  useSolanaConnection,
  useSolanaWallet,
} from "../../contexts";
import type {
  Interaction,
  OperationSpec,
  SolanaConnection,
  SolanaTx,
  SolanaWalletAdapter,
  TokensByPoolId,
  WithSplTokenAccounts,
} from "../../models";
import {
  Amount,
  InteractionType,
  SwimDefiInstruction,
  SwimDefiInstructor,
  findTokenAccountForMint,
  getPoolState,
} from "../../models";
import { findOrThrow } from "../../utils";
import { useSplTokenAccountsQuery } from "../solana";
import type { UseAsyncGeneratorResult } from "../utils";
import { useAsyncGenerator } from "../utils";

const createOperations = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: Interaction,
): readonly OperationSpec[] => {
  const inputPool = poolSpecs[0];
  const outputPool = poolSpecs[poolSpecs.length - 1];
  const inputPoolTokens = tokensByPoolId[inputPool.id];
  const outputPoolTokens = tokensByPoolId[outputPool.id];

  switch (interaction.type) {
    case InteractionType.Add:
      return [
        {
          interactionId: interaction.id,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.Add,
          params: {
            inputAmounts: inputPoolTokens.tokens.map(
              (token) =>
                interaction.params.inputAmounts.get(token.id) ??
                Amount.zero(token),
            ),
            minimumMintAmount: interaction.params.minimumMintAmount,
          },
        },
      ];
    case InteractionType.RemoveUniform:
      return [
        {
          interactionId: interaction.id,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.RemoveUniform,
          params: {
            exactBurnAmount: interaction.params.exactBurnAmount,
            minimumOutputAmounts: inputPoolTokens.tokens.map(
              (token) =>
                interaction.params.minimumOutputAmounts.get(token.id) ??
                Amount.zero(token),
            ),
          },
        },
      ];
    case InteractionType.RemoveExactBurn:
      return [
        {
          interactionId: interaction.id,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.RemoveExactBurn,
          params: {
            exactBurnAmount: interaction.params.exactBurnAmount,
            outputTokenIndex: inputPoolTokens.tokens.findIndex(
              (token) => token.id === interaction.params.outputTokenId,
            ),
            minimumOutputAmount: interaction.params.minimumOutputAmount,
          },
        },
      ];
    case InteractionType.RemoveExactOutput:
      return [
        {
          interactionId: interaction.id,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.RemoveExactOutput,
          params: {
            maximumBurnAmount: interaction.params.maximumBurnAmount,
            exactOutputAmounts: inputPoolTokens.tokens.map(
              (token) =>
                interaction.params.exactOutputAmounts.get(token.id) ??
                Amount.zero(token),
            ),
          },
        },
      ];
    case InteractionType.Swap: {
      if (inputPool.id === outputPool.id) {
        return [
          {
            interactionId: interaction.id,
            poolId: inputPool.id,
            instruction: SwimDefiInstruction.Swap,
            params: {
              exactInputAmounts: inputPoolTokens.tokens.map(
                (token) =>
                  interaction.params.exactInputAmounts.get(token.id) ??
                  Amount.zero(token),
              ),
              outputTokenIndex: inputPoolTokens.tokens.findIndex(
                (token) => token.id === interaction.params.outputTokenId,
              ),
              minimumOutputAmount: interaction.params.minimumOutputAmount,
            },
          },
        ];
      }
      throw "handle chaining";
    }
    default:
      throw new Error("Unknown interaction type");
  }
};

const doPoolOperation = async (
  env: Env,
  solanaConnection: SolanaConnection,
  wallet: SolanaWalletAdapter,
  splTokenAccounts: readonly TokenAccount[],
  tokensByPoolId: TokensByPoolId,
  poolSpec: PoolSpec,
  operation: OperationSpec,
): Promise<string> => {
  const walletAddress = wallet.publicKey?.toBase58() ?? null;
  if (walletAddress === null) {
    throw new Error("Missing Solana wallet");
  }
  const poolState = await getPoolState(solanaConnection, poolSpec);
  if (poolState === null) {
    throw new Error("Missing pool state");
  }
  const poolTokens = tokensByPoolId[poolSpec.id];
  const lpTokenMintAddress = getSolanaTokenDetails(poolTokens.lpToken).address;
  const userLpAccount = findTokenAccountForMint(
    lpTokenMintAddress,
    walletAddress,
    splTokenAccounts,
  );
  const tokenMintAddresses = poolTokens.tokens.map(
    (token) => getSolanaTokenDetails(token).address,
  );
  const userTokenAccounts = tokenMintAddresses.map((mint) =>
    findTokenAccountForMint(mint, walletAddress, splTokenAccounts),
  );
  const instructor = new SwimDefiInstructor(
    env,
    solanaConnection,
    wallet,
    poolSpec.contract,
    poolSpec.address,
    poolSpec.authority,
    poolSpec.lpToken,
    poolState.governanceFeeKey.toBase58(),
    tokenMintAddresses,
    [...poolSpec.tokenAccounts.values()],
    userLpAccount?.address.toBase58(),
    userTokenAccounts.map((t) => t?.address.toBase58() ?? null),
  );

  const operationWithSplTokenAccounts = {
    ...operation,
    splTokenAccounts,
  };

  switch (operationWithSplTokenAccounts.instruction) {
    case SwimDefiInstruction.Add:
      return instructor.add(operationWithSplTokenAccounts);
    case SwimDefiInstruction.RemoveUniform:
      return instructor.removeUniform(operationWithSplTokenAccounts);
    case SwimDefiInstruction.RemoveExactBurn:
      return instructor.removeExactBurn(operationWithSplTokenAccounts);
    case SwimDefiInstruction.RemoveExactOutput:
      return instructor.removeExactOutput(operationWithSplTokenAccounts);
    case SwimDefiInstruction.Swap:
      return instructor.swap(operationWithSplTokenAccounts);
    default:
      throw new Error("Unknown instruction");
  }
};

async function* generatePoolOperationTxs(
  env: Env,
  solanaConnection: SolanaConnection,
  wallet: SolanaWalletAdapter,
  splTokenAccounts: readonly TokenAccount[],
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: Interaction,
): AsyncGenerator<SolanaTx> {
  const operations = createOperations(tokensByPoolId, poolSpecs, interaction);
  for (const operation of operations) {
    const poolSpec = findOrThrow(
      poolSpecs,
      (spec) => spec.id === operation.poolId,
    );
    const txId = await doPoolOperation(
      env,
      solanaConnection,
      wallet,
      splTokenAccounts,
      tokensByPoolId,
      poolSpec,
      operation,
    );
    const tx = await solanaConnection.getParsedTx(txId);
    yield {
      ecosystem: EcosystemId.Solana,
      txId,
      timestamp: tx.blockTime ?? null,
      interactionId: operation.interactionId,
      parsedTx: tx,
    };
  }
}

// TODO: Rename
interface Props {
  readonly tokensByPoolId: TokensByPoolId;
  readonly poolSpecs: readonly PoolSpec[];
  readonly interaction: WithSplTokenAccounts<Interaction>;
}

export const usePoolOperationsGenerator = (): UseAsyncGeneratorResult<
  Props,
  SolanaTx
> => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  const { wallet } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  return useAsyncGenerator<Props, SolanaTx>(
    async ({ interaction, poolSpecs, tokensByPoolId }) => {
      if (wallet === null) {
        throw new Error("Missing Solana wallet");
      }
      if (splTokenAccounts === null) {
        throw new Error("SPL token accounts not yet loaded");
      }
      return generatePoolOperationTxs(
        env,
        solanaConnection,
        wallet,
        splTokenAccounts,
        tokensByPoolId,
        poolSpecs,
        interaction,
      );
    },
  );
};
