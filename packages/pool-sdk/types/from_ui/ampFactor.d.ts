import type { Layout } from "@project-serum/borsh";
import type BN from "bn.js";
import type { DecimalBN } from "./decimal";
export interface AmpFactor {
    readonly initialValue: DecimalBN;
    readonly initialTs: BN;
    readonly targetValue: DecimalBN;
    readonly targetTs: BN;
}
export declare const ampFactor: (property?: string) => Layout<AmpFactor>;
