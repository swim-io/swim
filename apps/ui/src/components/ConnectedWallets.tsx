import { EuiIcon, EuiListGroup } from "@elastic/eui";
import type { ReadonlyRecord } from "@swim-io/utils";
import { truncate } from "@swim-io/utils";
import type { ReactElement } from "react";

import type { EcosystemId } from "../config";
import { ECOSYSTEMS } from "../config";
import { useWallets } from "../hooks";

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
                  <EuiIcon type={ECOSYSTEMS[ecosystemId as EcosystemId].logo} />{" "}
                  {truncate(address as string)}
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
                  <EuiIcon type={ECOSYSTEMS[ecosystemId as EcosystemId].logo} />{" "}
                  {truncate(address as string)}
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
                  <EuiIcon type={ECOSYSTEMS[ecosystemId as EcosystemId].logo} />{" "}
                  {truncate(address as string)}
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
