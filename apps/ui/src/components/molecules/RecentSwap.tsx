import { EuiAccordion, EuiHorizontalRule, EuiPanel } from "@elastic/eui";
import type React from "react";
import type { ReactNode } from "react";

import { useSplTokenAccountsQuery, useWallets } from "../../hooks";
import { useRecentInteractionIds } from "../../hooks/interaction";
import { InteractionType } from "../../models";
import { MultiConnectButton } from "../ConnectButton";

import { InteractionStateDisplay } from "./InteractionStateDisplay";

export const useNotReadyContent = (interactionCount: number): ReactNode => {
  const { isSuccess: didLoadSplTokenAccounts } = useSplTokenAccountsQuery();
  const wallets = useWallets();

  if (!wallets.solana.connected) {
    return "Connect your wallets to see recent interactions.";
  }
  if (!didLoadSplTokenAccounts) {
    return "Loading...";
  }
  if (interactionCount === 0) {
    return "Interactions are stored per browser. If you used incognito mode, they will not show up here.";
  }

  return null;
};

export const RecentSwap: React.FC = () => {
  const interactionIds = useRecentInteractionIds([InteractionType.Swap]);
  const notReadyContent = useNotReadyContent(interactionIds.length);
  return (
    <EuiAccordion
      id="recent-interactions"
      buttonContent={`Recent Swap (${interactionIds.length})`}
      extraAction={<MultiConnectButton size="s" fullWidth />}
    >
      <EuiPanel color="subdued">
        {notReadyContent
          ? notReadyContent
          : interactionIds.map((id, i) => (
              <>
                {i !== 0 && <EuiHorizontalRule />}
                <InteractionStateDisplay key={id} id={id} />
              </>
            ))}
      </EuiPanel>
    </EuiAccordion>
  );
};
