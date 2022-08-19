import type { EuiSelectableOption } from "@elastic/eui";
import {
  EuiAvatar,
  EuiHeaderSectionItemButton,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelectable,
  useGeneratedHtmlId,
} from "@elastic/eui";
import * as Sentry from "@sentry/react";
import { isValidEnv } from "@swim-io/core";
import { useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { selectEnvs } from "../core/selectors";
import { useEnvironment } from "../core/store";

export const EnvSelector = (): ReactElement => {
  const { t } = useTranslation();
  const { env, setEnv } = useEnvironment();
  const envs = useEnvironment(selectEnvs, shallow);
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (envOptions: readonly EuiSelectableOption[]): void => {
    const newEnv = envOptions.find((option) => option.checked)?.key;

    if (newEnv && isValidEnv(newEnv)) {
      setEnv(newEnv);
      Sentry.setTag("config.env", newEnv);
    }

    setIsOpen(false);
  };

  const handleButtonClick = (): void => {
    setIsOpen((prevState) => !prevState);
  };
  const closePopover = (): void => {
    setIsOpen(false);
  };

  const id = useGeneratedHtmlId({ prefix: "envSelector" });

  const envOptions: readonly EuiSelectableOption[] = envs.map(
    (name: string) => ({
      key: name,
      label: name,
      prepend: <EuiAvatar type="space" name={name} size="s" />,
      checked: name === env ? "on" : undefined,
    }),
  );

  const selectedEnv =
    envOptions.find((option) => option.checked) ?? envOptions[0];

  const button = (
    <EuiHeaderSectionItemButton
      aria-controls={id}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-label={t("general.select_network")}
      onClick={handleButtonClick}
    >
      {selectedEnv.prepend}
    </EuiHeaderSectionItemButton>
  );

  const selectableProps =
    envOptions.length > 4
      ? {
          searchable: true as const,
          searchProps: {
            placeholder: t("general.select_network"),
            compressed: true,
          },
        }
      : { searchable: false as const };

  return (
    <EuiPopover
      id={id}
      ownFocus
      button={button}
      isOpen={isOpen}
      anchorPosition="downLeft"
      closePopover={closePopover}
      panelPaddingSize="s"
    >
      <EuiSelectable
        {...selectableProps}
        options={[...envOptions]}
        singleSelection="always"
        style={{ width: 300 }}
        onChange={handleChange}
        listProps={{
          rowHeight: 40,
          showIcons: false,
        }}
      >
        {(list, search) => (
          <>
            <EuiPopoverTitle>
              {search || t("general.select_network")}
            </EuiPopoverTitle>
            {list}
          </>
        )}
      </EuiSelectable>
    </EuiPopover>
  );
};
