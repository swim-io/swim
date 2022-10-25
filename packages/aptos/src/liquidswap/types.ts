import type { Types } from "aptos";

export interface PoolResource {
  readonly data: {
    readonly coin_x_reserve: {
      readonly value: string;
    };
    readonly coin_y_reserve: {
      readonly value: string;
    };
    readonly dao_fee: string;
    readonly fee: string;
    readonly last_block_timestamp: string;
    readonly last_price_x_cumulative: string;
    readonly last_price_y_cumulative: string;
    readonly x_scale: string;
    readonly y_scale: string;
  };
  readonly type: Types.MoveStructTag;
}
