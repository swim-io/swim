import { Env } from "@swim-io/core";
export interface RedeemerConfig {
    readonly programAddress: string;
    readonly programPda: string;
    readonly nftCollection: string;
    readonly vaultMint: string;
    readonly vaultTokenAccount: string;
}
export declare const redeemerConfigs: ReadonlyMap<Env, RedeemerConfig>;
