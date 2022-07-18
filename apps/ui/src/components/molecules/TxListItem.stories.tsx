import { EuiListGroup } from "@elastic/eui";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { TxListItem } from "./TxListItem";

const Meta: ComponentMeta<typeof TxListItem> = {
  component: TxListItem,
};
export default Meta;

const Template: ComponentStory<typeof TxListItem> = (args) => (
  <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
    <TxListItem {...args} />
  </EuiListGroup>
);

export const Ethereum = Template.bind({});
Ethereum.args = {
  ecosystem: "ethereum",
  txId: "0x3b0458fab01fea217bc0b1b64550cec1b347e30ecf5b965c359da707d50dad7f",
};

export const Solana = Template.bind({});
Solana.args = {
  ecosystem: "solana",
  txId: "5Q8KyhSGJtHJvWuLuA4SomQZ2W9kgjWRqwskzZMmj5JMm4vRA2H8i7gWVML1Ksr3zvRzkJ8Rp2ESc21gYfzDmZKu",
};
