/**
 * We currently use this with Wormhole SDK’s getSignedVAAWithRetry function.
 * By default this function retries every 1 second.
 */
export const DEFAULT_WORMHOLE_RETRIES = 300;
/**
 * Polygon requires 512 confirmations for finality, or roughly 18 minutes.
 */
export const POLYGON_WORMHOLE_RETRIES = 1200;
