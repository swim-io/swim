export function shortenAddress(address: string, chars = 5): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export const isUserOnMobileDevice = (): boolean => {
  // device detection via regex on navigator.userAgent, source stackoverflow
  return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
    navigator.userAgent,
  );
};

export const pluralize = (text: string, shouldPluralize = true): string =>
  shouldPluralize ? `${text}s` : text;
