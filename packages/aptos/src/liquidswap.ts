export interface PoolResource {
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
}

// From https://github.com/pontem-network/liquidswap/blob/b89aed9adb96c0b083134765f75be814418be670/sources/swap/liquidity_pool.move#L70-L74
export const FEE_DECIMALS = 4;
export const DAO_FEE_DECIMALS = 2;
