/** Ecosystem-neutral transaction interface */
export interface Tx<OriginalTx, EcosystemId extends string = string> {
  readonly id: string;
  readonly ecosystemId: EcosystemId;
  /** The time in seconds since Unix epoch */
  readonly timestamp: number | null;
  readonly interactionId: string | null;
  readonly original: OriginalTx;
}
