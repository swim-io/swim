<<<<<<< HEAD
/** Ecosystem-neutral transaction interface */
=======
>>>>>>> aa8ce89c (feat(core): Add package)
export interface Tx {
  readonly id: string;
  readonly ecosystemId: string;
  /** The time in seconds since Unix epoch */
  readonly timestamp: number | null;
  readonly interactionId: string | null;
}
