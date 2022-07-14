import type { ComponentMeta, ComponentStory } from "@storybook/react";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";

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
  fromEcosystem: ETHEREUM_ECOSYSTEM_ID,
  toEcosystem: ETHEREUM_ECOSYSTEM_ID,
};
