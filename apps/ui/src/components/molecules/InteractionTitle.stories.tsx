import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { BSC_USDT_TO_ETH_USDC_SWAP } from "../../fixtures/swim/interactions";

import { InteractionTitle } from "./InteractionTitle";

const Meta: ComponentMeta<typeof InteractionTitle> = {
  component: InteractionTitle,
};
export default Meta;

const Template: ComponentStory<typeof InteractionTitle> = (args) => (
  <InteractionTitle {...args} />
);

export const Swap = Template.bind({});
Swap.args = {
  interaction: BSC_USDT_TO_ETH_USDC_SWAP,
  // ETH_USDC_TO_SOL_USDC_SWAP,
  // SOL_USDC_TO_ETH_USDC_SWAP,
  // SOL_USDC_TO_SOL_USDT_SWAP,
};

// export const Solana = Template.bind({});
// Solana.args = {
//   ecosystem: EcosystemId.Solana,
//   txId: "5Q8KyhSGJtHJvWuLuA4SomQZ2W9kgjWRqwskzZMmj5JMm4vRA2H8i7gWVML1Ksr3zvRzkJ8Rp2ESc21gYfzDmZKu",
// };
