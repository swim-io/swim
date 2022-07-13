import type { ComponentMeta, ComponentStory } from "@storybook/react";

import {
  ADD,
  // BNB_USDT_TO_ETH_USDC_SWAP,
} from "../../fixtures/swim/interactions";

import { InteractionTitleV2 } from "./InteractionTitleV2";

const Meta: ComponentMeta<typeof InteractionTitleV2> = {
  component: InteractionTitleV2,
};
export default Meta;

const Template: ComponentStory<typeof InteractionTitleV2> = (args) => (
  <InteractionTitleV2 {...args} />
);

// export const Swap = Template.bind({});
// Swap.args = {
//   interaction: BNB_USDT_TO_ETH_USDC_SWAP,
// };

export const Add = Template.bind({});
Add.args = {
  interaction: ADD,
};
