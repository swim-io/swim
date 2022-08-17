// react/prop-types does not work in complex typescript prop types
/* eslint-disable react/prop-types */

import { EuiFieldNumber } from "@elastic/eui";
import type { ComponentProps } from "react";
import { forwardRef, useCallback, useState } from "react";
import CurrencyInput from "react-currency-input-field";
import { useDeepCompareMemo } from "use-deep-compare";

import { useI18nLanguage } from "../hooks";

/** Use `inputRef` as `ref` in order to get input element reference for `react-currency-input-field` to `setSelectionRange`. Without it, when adding/removing numbers with group separators (e.g. `,` for English), the cursor will always move to the end */
const MappedEuiFieldNumber = forwardRef<
  HTMLInputElement,
  ComponentProps<typeof EuiFieldNumber>
>(function MappedEuiFieldNumber(props, ref) {
  return <EuiFieldNumber {...props} inputRef={ref} />;
});

type Override<T, U> = Omit<T, keyof U> & U;
type Props = Override<
  Omit<
    ComponentProps<typeof CurrencyInput>,
    "customInput" | "onChange" | "value"
  >,
  {
    /** value must be a standard number which does not have group separators and use `.` as decimal separators */
    readonly defaultValue?: string;

    /** value will be an empty string or a standard number which does not have group separators and use `.` as decimal separators */
    readonly onValueChange: (value: string) => void;
  }
> &
  Pick<
    ComponentProps<typeof EuiFieldNumber>,
    | "append"
    | "compressed"
    | "controlOnly"
    | "fullWidth"
    | "icon"
    | "isInvalid"
    | "isLoading"
    | "prepend"
  >;
export const EuiFieldIntlNumber: React.FC<Props> = ({
  onValueChange: originalOnValueChange,
  ...props
}) => {
  const language = useI18nLanguage();
  const intlConfig = useDeepCompareMemo(() => {
    return {
      ...props.intlConfig,
      locale: language,
    };
  }, [language, props.intlConfig]);

  // there is bug in the library where uncontrolled component will break the `step`, so pretend to be a controlled component by using `value` to replace `defaultValue`
  const [inputValue, setInputValue] = useState(props.defaultValue ?? "");
  const onValueChange = useCallback<
    NonNullable<ComponentProps<typeof CurrencyInput>["onValueChange"]>
  >(
    (value, name, values) => {
      setInputValue(value ?? "");
      originalOnValueChange(
        values?.float !== undefined ? String(values.float) : "",
      );
    },
    [originalOnValueChange],
  );

  return (
    <CurrencyInput
      {...props}
      customInput={MappedEuiFieldNumber}
      decimalsLimit={props.decimalsLimit ?? 20} // default max value allowed by Intl.NumberFormat
      intlConfig={intlConfig}
      onValueChange={onValueChange}
      value={inputValue}
    />
  );
};
