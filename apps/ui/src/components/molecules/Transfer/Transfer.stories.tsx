import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { EcosystemId, TOKENS } from "../../../config";

import { Transfer } from "./Transfer";

const Meta: ComponentMeta<typeof Transfer> = {
  component: Transfer,
};
export default Meta;

const Template: ComponentStory<typeof Transfer> = (args) => (
  <Transfer {...args} />
);

export const Loading = Template.bind({});
Loading.args = {
  token: TOKENS.Mainnet[0],
  from: EcosystemId.Solana,
  to: EcosystemId.Ethereum,
  isLoading: true,
  transactions: [
    {
      ecosystem: EcosystemId.Ethereum,
      txId: "0x3b0458fab01fea217bc0b1b64550cec1b347e30ecf5b965c359da707d51dad7f",
    },
    {
      ecosystem: EcosystemId.Ethereum,
      txId: "0x3b0458fab01fea217bc0b1b64550cec1b347e30ecf5b965c359da707d50dad7f",
    },
  ],
};

export const Loaded = Template.bind({});
Loaded.args = {
  token: TOKENS.Mainnet[0],
  from: EcosystemId.Solana,
  to: EcosystemId.Ethereum,
  isLoading: false,
  transactions: [
    {
      ecosystem: EcosystemId.Ethereum,
      txId: "0x3b0458fab01fea217bc0b1b64550cec1b347e30ecf5b965c359da707d51dad7f",
    },
    {
      ecosystem: EcosystemId.Ethereum,
      txId: "0x3b0458fab01fea217bc0b1b64550cec1b347e30ecf5b965c359da707d50dad7f",
    },
  ],
};
