import { getAddLiquidityTransactionPayload, parsePoolAddress } from "./utils";

describe("utils", () => {
  const poolAddress =
    "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::liquidity_pool::LiquidityPool<0x30ab37efc691ea7202540b50f3f0f6b090adb143c0746fd49a7e4b7c5870ce8b::coin::T, 0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC, 0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated>";

  describe("getAddLiquidityTransactionPayload", () => {
    it("should create a AddLiquidity Transaction payload", () => {
      const coinXAmountAtomic = "1000000";
      const coinYAmountAtomic = "2000000";
      expect(
        getAddLiquidityTransactionPayload({
          poolAddress,
          coinXAmountAtomic,
          coinYAmountAtomic,
        }),
      ).toEqual({
        type: "entry_function_payload",
        function:
          "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::add_liquidity",
        type_arguments: [
          "0x30ab37efc691ea7202540b50f3f0f6b090adb143c0746fd49a7e4b7c5870ce8b::coin::T",
          "0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC",
          "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated",
        ],
        arguments: [coinXAmountAtomic, "0", coinYAmountAtomic, "0"],
      });
    });
  });

  describe("parsePoolAddress", () => {
    it("should parse pool info from its address", () => {
      expect(parsePoolAddress(poolAddress)).toEqual({
        liquidswapAccountAddress:
          "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12",
        coinXType:
          "0x30ab37efc691ea7202540b50f3f0f6b090adb143c0746fd49a7e4b7c5870ce8b::coin::T",
        coinYType:
          "0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC",
        curveType:
          "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated",
      });
    });
  });
});
