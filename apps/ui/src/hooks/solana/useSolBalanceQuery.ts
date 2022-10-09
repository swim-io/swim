import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { useEffect, useState } from "react";

import { useEnvironment } from "../../core/store";

import { useSolanaClient } from "./useSolanaClient";
import { useSolanaWallet } from "./useSolanaWallet";

const lamportsToSol = (balance: number): Decimal => {
  return new Decimal(balance).dividedBy(LAMPORTS_PER_SOL);
};

// Returns user's Solana balance in SOL.
export const useSolBalanceQuery = ({
  enabled = true,
}: {
  readonly enabled?: boolean;
} = {}) => {
  const { env } = useEnvironment();
  const solanaClient = useSolanaClient();
  const { address: walletAddress } = useSolanaWallet();

  const [isSuccess, setIsSuccess] = useState(false);
  const [solBalance, setSolBalance] = useState(new Decimal(0));
  // reset balance when switching env or wallet address
  useEffect(() => {
    setSolBalance(new Decimal(0));
    setIsSuccess(false);
  }, [env, walletAddress]);

  useEffect(() => {
    if (!walletAddress || !enabled) {
      setIsSuccess(true);
      return;
    }

    // Make sure all network requests are ignored after exit, so the state is not mixed, e.g. state between different wallet addresses
    let isExited = false;

    const publicKey = new PublicKey(walletAddress);

    solanaClient.connection
      .getBalance(publicKey)
      .then((balance) => {
        if (isExited) return;

        setSolBalance(lamportsToSol(balance));
        setIsSuccess(true);
      })
      .catch(() => {
        if (isExited) return;

        setSolBalance(new Decimal(0));
        setIsSuccess(true);
      });

    const clientSubscriptionId = solanaClient.connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        if (isExited) return;

        setSolBalance(lamportsToSol(accountInfo.lamports));
      },
    );
    return () => {
      isExited = true;

      solanaClient.connection
        .removeAccountChangeListener(clientSubscriptionId)
        .catch(console.error);
    };
  }, [
    enabled,
    // make sure we are depending on `solanaClient.connection` not `solanaClient` because the reference of `solanaClient` won't change when we rotate the connection
    solanaClient.connection,
    walletAddress,
  ]);

  return { isSuccess, data: solBalance };
};
