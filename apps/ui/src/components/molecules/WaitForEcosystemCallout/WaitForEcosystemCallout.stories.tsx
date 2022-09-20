import { EuiListGroup } from "@elastic/eui";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import { EvmEcosystemId } from "@swim-io/evm";

import { WaitForEcosystemCallout } from "./WaitForEcosystemCallout";

const Meta: ComponentMeta<typeof WaitForEcosystemCallout> = {
  component: WaitForEcosystemCallout,
};
export default Meta;

const Template: ComponentStory<typeof WaitForEcosystemCallout> = (args) => (
  <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
    <WaitForEcosystemCallout {...args} />
  </EuiListGroup>
);

export const Bnb = Template.bind({});
Bnb.args = {
  ecosystemId: EvmEcosystemId.Bnb,
};

export const Ethereum = Template.bind({});
Ethereum.args = {
  ecosystemId: EvmEcosystemId.Ethereum,
};

export const Polygon = Template.bind({});
Polygon.args = {
  ecosystemId: EvmEcosystemId.Polygon,
};
