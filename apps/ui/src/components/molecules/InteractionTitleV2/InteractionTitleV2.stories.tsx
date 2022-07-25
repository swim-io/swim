import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { SINGLE_CHAIN_SOLANA_INTERACTION } from "../../../fixtures/swim/interactionStateV2";
import { ADD } from "../../../fixtures/swim/interactions";

import { InteractionTitleV2 } from "./InteractionTitleV2";

const Meta: ComponentMeta<typeof InteractionTitleV2> = {
  component: InteractionTitleV2,
};
export default Meta;

const Template: ComponentStory<typeof InteractionTitleV2> = (args) => (
  <InteractionTitleV2 {...args} />
);

export const Swap = Template.bind({});
Swap.args = {
  interaction: SINGLE_CHAIN_SOLANA_INTERACTION,
};

export const Add = Template.bind({});
Add.args = {
  interaction: ADD,
};
