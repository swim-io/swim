export interface Tx {
  readonly id: string;
  readonly ecosystemId: string;
  /** The time in seconds since Unix epoch */
  readonly timestamp: number | null;
  readonly interactionId: string | null;
}
