import type { EuiSelectOption, EuiSelectableOption } from "@elastic/eui";
import {
  EuiHeaderSectionItemButton,
  EuiIcon,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelect,
  EuiSelectable,
  useGeneratedHtmlId,
} from "@elastic/eui";
import { useState } from "react";
import type { ComponentProps, ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { Language, languageNameMapping } from "../config";
import { useI18nLanguage } from "../hooks";

export const LanguageSelectorButton = (): ReactElement => {
  const { t, i18n } = useTranslation();
  const currentLanguage = useI18nLanguage();

  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (
    languageOptions: readonly EuiSelectableOption[],
  ): void => {
    const newLanguage = languageOptions.find((option) => option.checked)?.key;

    if (newLanguage) {
      i18n.changeLanguage(newLanguage).catch(console.error);
    }

    setIsOpen(false);
  };

  const handleButtonClick = (): void => {
    setIsOpen((prevState) => !prevState);
  };
  const closePopover = (): void => {
    setIsOpen(false);
  };

  const id = useGeneratedHtmlId({ prefix: "languageSelectorButton" });

  const button = (
    <EuiHeaderSectionItemButton
      aria-controls={id}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-label={t("general.select_language")}
      onClick={handleButtonClick}
    >
      <EuiIcon type="globe" />
    </EuiHeaderSectionItemButton>
  );

  const languageOptions: readonly EuiSelectableOption[] = Object.values(
    Language,
  ).map((language) => {
    return {
      key: language,
      label: languageNameMapping[language],
      checked: currentLanguage === language ? "on" : undefined,
    };
  });

  const selectableProps: Partial<ComponentProps<typeof EuiSelectable>> =
    languageOptions.length > 4
      ? {
          searchable: true,
          searchProps: {
            placeholder: t("general.select_language"),
            compressed: true,
          },
        }
      : { searchable: false };

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
        options={[...languageOptions]}
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
              {search || t("general.select_language")}
            </EuiPopoverTitle>
            {list}
          </>
        )}
      </EuiSelectable>
    </EuiPopover>
  );
};

export const LanguageSelectorDropdown = (): ReactElement => {
  const { t, i18n } = useTranslation();
  const currentLanguage = useI18nLanguage();

  // eslint-disable-next-line functional/prefer-readonly-type
  const languageOptions: EuiSelectOption[] = Object.values(Language).map(
    (language) => {
      return {
        value: language,
        text: languageNameMapping[language],
      };
    },
  );

  const languageSelectorDropdownId = useGeneratedHtmlId({
    prefix: "languageSelectorDropdown",
  });

  return (
    // make the select width equal to option's text width
    <div style={{ width: "auto" }}>
      <EuiSelect
        id={languageSelectorDropdownId}
        options={languageOptions}
        value={currentLanguage}
        onChange={(e) => {
          i18n.changeLanguage(e.target.value).catch(console.error);
        }}
        aria-label={t("general.select_language")}
        compressed
      />
    </div>
  );
};
