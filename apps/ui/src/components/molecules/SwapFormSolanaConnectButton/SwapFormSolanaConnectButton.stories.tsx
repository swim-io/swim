import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { EcosystemId } from "../../../config";

import { SwapFormSolanaConnectButton } from "./SwapFormSolanaConnectButton";

const Meta: ComponentMeta<typeof SwapFormSolanaConnectButton> = {
  component: SwapFormSolanaConnectButton,
};
export default Meta;

const Template: ComponentStory<typeof SwapFormSolanaConnectButton> = (args) => (
  <SwapFormSolanaConnectButton {...args} />
);

export const Button = Template.bind({});
Button.args = {
  fromEcosystem: EcosystemId.Ethereum,
  toEcosystem: EcosystemId.Ethereum,
};
