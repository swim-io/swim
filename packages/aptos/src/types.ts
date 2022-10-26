import type { Types } from "aptos";

export interface GasScheduleV2 {
  readonly entries: readonly {
    readonly key: string;
    readonly value: string;
  }[];
}

export interface CoinInfoResource {
  readonly data: {
    readonly decimals: number;
    readonly name: string;
    readonly supply: {
      readonly vec: readonly [
        {
          readonly integer: {
            readonly vec: readonly [
              {
                readonly limit: string;
                readonly value: string;
              },
            ];
          };
        },
      ];
    };
    readonly symbol: string;
  };
  readonly type: Types.MoveStructTag;
}

export interface CoinResource {
  readonly data: { readonly coin: { readonly value: string } };
  readonly type: Types.MoveStructTag;
}
