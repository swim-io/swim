import { EuiIcon, EuiListGroup } from "@elastic/eui";
import type { ReactElement } from "react";
// import shallow from "zustand/shallow.js";

import type { EcosystemId } from "../config";
// import { selectConfig } from "../core/selectors";
// import { useEnvironment } from "../core/store";
import { useWallets } from "../hooks";
import type { ReadonlyRecord } from "../utils";
import { shortenAddress } from "../utils";

interface ConnectedWalletsProps {
  readonly walletAddresses: ReadonlyRecord<EcosystemId, string | null>;
}

export const ConnectedWallets = ({
  walletAddresses,
}: ConnectedWalletsProps): ReactElement => {
  const wallets = useWallets();
  // const { ecosystems } = useEnvironment(selectConfig, shallow);

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
                  {/* TODO: Logo */}
                  <EuiIcon
                    type={"ecosystems[ecosystemId as EcosystemId].logo"}
                  />{" "}
                  {shortenAddress(address as string)}
                  <span>&nbsp;(not connected)</span>
                </>
              ),
              color: "subdued",
              iconType: "offline",
            };
          } else if (wallets[ecosystemId as EcosystemId].address === address) {
            return {
              label: (
                <>
                  {/* TODO: Logo */}
                  <EuiIcon
                    type={"ecosystems[ecosystemId as EcosystemId].logo"}
                  />{" "}
                  {shortenAddress(address as string)}
                  <span>&nbsp;(connected)</span>
                </>
              ),
              color: "text",
              iconType: "check",
            };
          } else {
            return {
              label: (
                <>
                  {/* TODO: Logo */}
                  <EuiIcon
                    type={"ecosystems[ecosystemId as EcosystemId].logo"}
                  />{" "}
                  {shortenAddress(address as string)}
                  <span>&nbsp;(different account)</span>
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
