import type { ComponentMeta, ComponentStory } from "@storybook/react";
import { EvmEcosystemId } from "@swim-io/evm";

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
  fromEcosystem: EvmEcosystemId.Ethereum,
  toEcosystem: EvmEcosystemId.Ethereum,
};
