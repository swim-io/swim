import { EuiIcon, EuiListGroup } from "@elastic/eui";
import type { ReactElement } from "react";

import type { EcosystemId } from "../config";
import { ecosystems } from "../config";
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
                  <EuiIcon type={ecosystems[ecosystemId as EcosystemId].logo} />{" "}
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
                  <EuiIcon type={ecosystems[ecosystemId as EcosystemId].logo} />{" "}
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
                  <EuiIcon type={ecosystems[ecosystemId as EcosystemId].logo} />{" "}
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
