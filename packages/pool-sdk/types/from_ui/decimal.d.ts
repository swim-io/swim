import type { Layout } from "@project-serum/borsh";
import type BN from "bn.js";
export interface DecimalBN {
    readonly value: BN;
    readonly decimals: number;
}
export declare const decimal: (property?: string) => Layout<DecimalBN>;
