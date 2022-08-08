import { EuiIcon, EuiListGroup } from "@elastic/eui";
import type { ReadonlyRecord } from "@swim-io/utils";
import { truncate } from "@swim-io/utils";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import type { EcosystemId } from "../config";
import { ECOSYSTEMS } from "../config";
import { useWallets } from "../hooks";

interface ConnectedWalletsProps {
  readonly walletAddresses: ReadonlyRecord<EcosystemId, string | null>;
}

export const ConnectedWallets = ({
  walletAddresses,
}: ConnectedWalletsProps): ReactElement => {
  const { t } = useTranslation();
  const wallets = useWallets();

  return (
    <EuiListGroup
      bordered
      listItems={Object.entries(walletAddresses)
        .filter(([_, address]) => address !== null)
        .map(([ecosystemId, address]) => {
          if (!wallets[ecosystemId as EcosystemId].connected) {
            return {
              label: (
                <>
                  <EuiIcon type={ECOSYSTEMS[ecosystemId as EcosystemId].logo} />{" "}
                  {t("recent_interactions.connected_wallet_is_not_connected", {
                    walletAddress: truncate(address as string),
                  })}
                </>
              ),
              color: "subdued",
              iconType: "offline",
            };
          } else if (wallets[ecosystemId as EcosystemId].address === address) {
            return {
              label: (
                <>
                  <EuiIcon type={ECOSYSTEMS[ecosystemId as EcosystemId].logo} />{" "}
                  {t("recent_interactions.connected_wallet_is_connected", {
                    walletAddress: truncate(address as string),
                  })}
                </>
              ),
              color: "text",
              iconType: "check",
            };
          } else {
            return {
              label: (
                <>
                  <EuiIcon type={ECOSYSTEMS[ecosystemId as EcosystemId].logo} />{" "}
                  {t(
                    "recent_interactions.connected_wallet_is_different_account",
                    { walletAddress: truncate(address as string) },
                  )}
                </>
              ),
              color: "text",
              iconType: "alert",
            };
          }
        })}
    />
  );
};
