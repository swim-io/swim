import type { Env } from "@swim-io/core";
import type {
  EvmChainConfig,
  EvmEcosystemConfig,
  EvmEcosystemId,
} from "@swim-io/evm";
import type { SolanaChainConfig, SolanaEcosystemConfig } from "@swim-io/solana";
import type { Override, ReadonlyRecord } from "@swim-io/utils";

import type { TokenConfig } from "../tokens";

export type EvmChainConfigV1<E extends EvmEcosystemId = EvmEcosystemId> =
  Override<
    EvmChainConfig<E>,
    {
      readonly tokens: readonly Omit<TokenConfig, "nativeEcosystemId">[];
    }
  >;

export type EvmEcosystemConfigV1<E extends EvmEcosystemId = EvmEcosystemId> =
  Override<
    EvmEcosystemConfig<E>,
    {
      readonly chains: Partial<ReadonlyRecord<Env, EvmChainConfigV1<E>>>;
    }
  >;

export type SolanaChainConfigV1 = Override<
  SolanaChainConfig,
  {
    readonly tokens: readonly Omit<TokenConfig, "nativeEcosystemId">[];
  }
>;

export type SolanaEcosystemConfigV1 = Override<
  SolanaEcosystemConfig,
  {
    readonly chains: Partial<ReadonlyRecord<Env, SolanaChainConfigV1>>;
  }
>;
