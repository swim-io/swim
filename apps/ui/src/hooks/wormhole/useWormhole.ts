import { useEffect, useRef, useState } from "react";
import shallow from "zustand/shallow.js";

import type { TokenDetails, TokenSpec } from "../../config";
import { EcosystemId, ecosystems } from "../../config";
import { useSolanaWallet } from "../../contexts";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { Amount, generateId } from "../../models";
import { useTokensByEcosystem, useUserNativeBalances } from "../crossEcosystem";
import { useSplTokenAccountsQuery } from "../solana";

import { useTransferEvmTokenToSolanaMutation } from "./useTransferEvmTokenToSolanaMutation";
import { useTransferSplTokenToEvmMutation } from "./useTransferSplTokenToEvmMutation";

const useEnvOrFromEcosystemChangeEffect = (
  fromEcosystem: EcosystemId,
  setTokenId: (tokenId: string) => void,
): void => {
  const { env } = useEnvironment();
  const tokensByEcosystem = useTokensByEcosystem();

  const envRef = useRef(env);
  const fromEcosystemRef = useRef(fromEcosystem);
  // If either env or fromEcosystem changes then we need to reset the token
  useEffect(() => {
    if (fromEcosystem === fromEcosystemRef.current && env === envRef.current) {
      return;
    }
    // eslint-disable-next-line functional/immutable-data
    fromEcosystemRef.current = fromEcosystem;
    // eslint-disable-next-line functional/immutable-data
    envRef.current = env;
    const [newDefaultToken] = tokensByEcosystem[fromEcosystem];
    setTokenId(newDefaultToken.id);
  }, [fromEcosystem, env, tokensByEcosystem, setTokenId]);
};

export interface WormholeState {
  readonly tokenId: string;
  readonly setTokenId: (id: string) => void;
  readonly tokenSpec: TokenSpec;
  readonly fromTokenDetails: TokenDetails;
  readonly toTokenDetails: TokenDetails;
  readonly fromEcosystem: EcosystemId;
  readonly setFromEcosystem: (ecosystem: EcosystemId) => void;
  readonly toEcosystem: EcosystemId;
  readonly setToEcosystem: (ecosystem: EcosystemId) => void;
  readonly transferAmount: string;
  readonly setTransferAmount: (amount: string) => void;
  readonly executeTransfer: () => Promise<void>;
  readonly transferError: Error | null;
}

export const useWormhole = (): WormholeState => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const tokensByEcosystem = useTokensByEcosystem();
  const { wallet: solanaWallet } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  const userNativeBalances = useUserNativeBalances();

  const [defaultToken] = tokensByEcosystem[EcosystemId.Solana];
  const [tokenId, setTokenId] = useState(defaultToken.id);
  // Fall back to first token in case eg the Env changed
  const tokenSpec = tokens.find(({ id }) => id === tokenId) ?? tokens[0];
  const [fromEcosystem, setFromEcosystem] = useState(tokenSpec.nativeEcosystem);
  const [toEcosystem, setToEcosystem] = useState(
    [...tokenSpec.detailsByEcosystem.keys()].find(
      (key) => key !== fromEcosystem,
    ) ?? fromEcosystem, // Fallback should never be needed if tokens are configured properly
  );
  const fromTokenDetails =
    tokenSpec.detailsByEcosystem.get(fromEcosystem) ?? null;
  const toTokenDetails = tokenSpec.detailsByEcosystem.get(toEcosystem) ?? null;
  if (!fromTokenDetails || !toTokenDetails) {
    throw new Error("Could not find token details");
  }
  const [transferAmount, setTransferAmount] = useState("0");

  const splTokenContractAddress =
    tokenSpec.detailsByEcosystem.get(EcosystemId.Solana)?.address ?? null;

  const transferEthereumTokenToSolanaMutation =
    useTransferEvmTokenToSolanaMutation(EcosystemId.Ethereum, tokenSpec);
  const transferBscTokenToSolanaMutation = useTransferEvmTokenToSolanaMutation(
    EcosystemId.Bsc,
    tokenSpec,
  );
  const transferSplTokenToEthereumMutation = useTransferSplTokenToEvmMutation(
    EcosystemId.Ethereum,
    tokenSpec,
  );
  const transferSplTokenToBscMutation = useTransferSplTokenToEvmMutation(
    EcosystemId.Bsc,
    tokenSpec,
  );

  const transferMutation =
    fromEcosystem === EcosystemId.Solana
      ? toEcosystem === EcosystemId.Ethereum
        ? transferSplTokenToEthereumMutation
        : transferSplTokenToBscMutation
      : fromEcosystem === EcosystemId.Ethereum
      ? transferEthereumTokenToSolanaMutation
      : transferBscTokenToSolanaMutation;

  const executeTransfer = async (): Promise<void> => {
    if (!solanaWallet) {
      throw new Error("No Solana wallet connected");
    }
    if (!splTokenContractAddress) {
      throw new Error("No SPL token contract specified");
    }
    if (splTokenAccounts === null) {
      throw new Error("Missing SPL token accounts");
    }
    new Set([EcosystemId.Solana, fromEcosystem, toEcosystem]).forEach(
      (ecosystem) => {
        if (
          ecosystem !== EcosystemId.Solana &&
          userNativeBalances[ecosystem].isZero()
        ) {
          throw new Error(
            `Empty balance in ${ecosystems[ecosystem].displayName} wallet. You will need some funds to pay for transaction fees.`,
          );
        }
      },
    );

    const amount = Amount.fromHumanString(tokenSpec, transferAmount);
    return transferMutation.mutate({
      interactionId: generateId(),
      transferAmount: amount,
    });
  };

  useEnvOrFromEcosystemChangeEffect(fromEcosystem, setTokenId);

  return {
    tokenId,
    setTokenId,
    tokenSpec,
    fromTokenDetails,
    toTokenDetails,
    fromEcosystem,
    setFromEcosystem,
    toEcosystem,
    setToEcosystem,
    transferAmount,
    setTransferAmount,
    executeTransfer,
    transferError: transferMutation.error,
  };
};
