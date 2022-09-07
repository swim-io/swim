/** To keep the original type of the input while ensuring it conforms to a generic type */
export const assertType = <T>() => {
  return <U extends T>(input: U): U => input;
};
