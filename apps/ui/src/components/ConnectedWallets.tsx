import { EuiIcon, EuiListGroup } from "@elastic/eui";
import type { ReadonlyRecord } from "@swim-io/utils";
import { getRecordEntries, truncate } from "@swim-io/utils";
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
      listItems={getRecordEntries(walletAddresses)
        .filter(
          <K, V>(entry: readonly [K, V | null]): entry is readonly [K, V] =>
            entry[1] !== null,
        )
        .map(([ecosystemId, address]) => {
          if (!wallets[ecosystemId].connected) {
            return {
              label: (
                <>
                  <EuiIcon type={ECOSYSTEMS[ecosystemId].logo} />{" "}
                  {t("recent_interactions.connected_wallet_is_not_connected", {
                    walletAddress: truncate(address),
                  })}
                </>
              ),
              color: "subdued",
              iconType: "offline",
            };
          } else if (wallets[ecosystemId].address === address) {
            return {
              label: (
                <>
                  <EuiIcon type={ECOSYSTEMS[ecosystemId].logo} />{" "}
                  {t("recent_interactions.connected_wallet_is_connected", {
                    walletAddress: truncate(address),
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
                  <EuiIcon type={ECOSYSTEMS[ecosystemId].logo} />{" "}
                  {t(
                    "recent_interactions.connected_wallet_is_different_account",
                    { walletAddress: truncate(address) },
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
