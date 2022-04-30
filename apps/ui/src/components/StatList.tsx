import { EuiFlexGroup, EuiFlexItem } from "@elastic/eui";
import type { FunctionComponent, ReactElement, ReactNode } from "react";

export interface StatListProps {
  readonly listItems?: ReadonlyArray<{
    readonly title: NonNullable<ReactNode>;
    readonly description: NonNullable<ReactNode>;
    readonly key: string;
  }>;
}

export const StatList: FunctionComponent<StatListProps> = ({
  listItems,
}): ReactElement => {
  return (
    <div className="statList">
      {listItems?.map((item) => {
        return (
          <EuiFlexGroup
            justifyContent="spaceBetween"
            responsive={false}
            className="statList__item"
            key={item.key}
          >
            <EuiFlexItem>{item.title}</EuiFlexItem>
            <EuiFlexItem grow={false}>{item.description}</EuiFlexItem>
          </EuiFlexGroup>
        );
      })}
    </div>
  );
};
