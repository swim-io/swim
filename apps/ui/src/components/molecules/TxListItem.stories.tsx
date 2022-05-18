import { EuiListGroup } from "@elastic/eui";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { EcosystemId } from "../../config";

import { TxListItem } from "./TxListItem";

export default {
  title: "TxListItem",
  component: TxListItem,
} as ComponentMeta<typeof TxListItem>;

export const Ethereum: ComponentStory<typeof TxListItem> = () => (
  <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
    <TxListItem
      ecosystem={EcosystemId.Ethereum}
      txId={
        "0x3b0458fab01fea217bc0b1b64550cec1b347e30ecf5b965c359da707d50dad7f"
      }
    />
  </EuiListGroup>
);

export const Solana: ComponentStory<typeof TxListItem> = () => (
  <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
    <TxListItem
      ecosystem={EcosystemId.Solana}
      txId={
        "5Q8KyhSGJtHJvWuLuA4SomQZ2W9kgjWRqwskzZMmj5JMm4vRA2H8i7gWVML1Ksr3zvRzkJ8Rp2ESc21gYfzDmZKu"
      }
    />
  </EuiListGroup>
);
