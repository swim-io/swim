export const truncate = (address: string, chars = 5): string =>
  address.length <= chars * 2
    ? address
    : `${address.slice(0, chars)}...${address.slice(-chars)}`;
