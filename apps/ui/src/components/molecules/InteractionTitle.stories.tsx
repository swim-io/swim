import type { ComponentMeta, ComponentStory } from "@storybook/react";

import {
  ADD,
  BSC_USDT_TO_ETH_USDC_SWAP,
} from "../../fixtures/swim/interactions";

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
};

export const Add = Template.bind({});
Add.args = {
  interaction: ADD,
};
