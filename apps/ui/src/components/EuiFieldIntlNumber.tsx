// react/prop-types does not work in complex typescript prop types
/* eslint-disable react/prop-types */

import { EuiFieldNumber } from "@elastic/eui";
import escapeStringRegexp from "escape-string-regexp";
import type { ComponentProps } from "react";
import { forwardRef, useCallback } from "react";
import CurrencyInput from "react-currency-input-field";

import { useIntlNumberSeparators } from "../hooks";

/** Use `inputRef` as `ref` in order to get input element reference for `react-currency-input-field` to `setSelectionRange`. Without it, when adding/removing numbers with group separators (e.g. `,` for English), the cursor will always move to the end */
const MappedEuiFieldNumber = forwardRef<
  HTMLInputElement,
  ComponentProps<typeof EuiFieldNumber>
>(function MappedEuiFieldNumber(props, ref) {
  return <EuiFieldNumber {...props} inputRef={ref} />;
});

type Override<T, U> = Omit<T, keyof U> & U;
type Props = Override<
  Omit<ComponentProps<typeof CurrencyInput>, "customInput" | "onChange">,
  {
    /** value will be an empty string or a standard number which does not have group separators and use `.` as decimal separators */
    readonly onValueChange: (value: string) => void;

    /** value must be a standard number which does not have group separators and use `.` as decimal separators */
    readonly value: string;
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
  const { decimal: decimalSeparator, group: groupSeparator } =
    useIntlNumberSeparators();

  const onValueChange = useCallback<
    NonNullable<ComponentProps<typeof CurrencyInput>["onValueChange"]>
  >(
    (value, name, values) => {
      /*
      Always response standard number which uses `.` as decimal separators
      The reason is we will save the number in string form with decimal separators in current language, if we do not normalize it, it may have bug when user changes language, example:
      1. user selects French
      2. type 1,234 and this value is saved in outter component state
      3. user selects English
      4. react-currency-input-field will treat 1,234 in English format, and convert it to 1234, which is 1000x more!
      */
      originalOnValueChange(
        (value ?? "").replace(
          new RegExp(escapeStringRegexp(decimalSeparator), "g"),
          ".",
        ),
      );
    },
    [decimalSeparator, originalOnValueChange],
  );

  return (
    <CurrencyInput
      {...props}
      customInput={MappedEuiFieldNumber}
      decimalsLimit={props.decimalsLimit ?? 20} // default max value allowed by Intl.NumberFormat
      decimalSeparator={decimalSeparator}
      groupSeparator={groupSeparator || undefined}
      disableGroupSeparators={Boolean(groupSeparator)}
      disableAbbreviations
      onValueChange={onValueChange}
      // always convert back to the current i18n format
      value={props.value.replace(/\./g, decimalSeparator)}
    />
  );
};
