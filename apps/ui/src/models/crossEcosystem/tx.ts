import type { EvmTx } from "@swim-io/evm";
import type { SolanaTx } from "@swim-io/solana";

export type Tx = SolanaTx | EvmTx;
