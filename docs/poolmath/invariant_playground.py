#!/usr/bin/env python3

from swim_invariant import SwimPool, Decimal

def lan_virtual_price_decrease():
    total_lp = [
        12053.94427,
        12053.91104,
        12053.87778,
        12053.84449,
        12053.82237,
        12053.81241,
        12053.80243,
        12053.79246,
    ]
    script_vp = [
        1.001145688,
        1.001134058,
        1.001145747,
        1.001188567,
        1.001141585,
        1.001125646,
        1.001112404,
        1.001101594,
    ]
    balances = [
        [
            1823.060695,
            1983.525735,
            1889.437562,
            1889.672064,
            2416.220598,
            2065.967071,
            12050.20393,
        ],
        [
            1823.060695,
            1983.525735,
            1889.437562,
            1889.672064,
            2083.220598,
            2398.819701,
            12050.20393,
        ],
        [
            1823.060695,
            1983.525735,
            1889.437562,
            1889.672064,
            1750.220598,
            2732.239701,
            12050.20393,
        ],
        [
            1823.060695,
            1983.525735,
            1889.437562,
            1889.672064,
            1417.220598,
            3066.407152,
            12050.20393,
        ],
        [
            1823.060695,
            1983.525735,
            1889.437562,
            1889.672064,
            1638.172742,
            2844.407152,
            12050.20393,
        ],
        [
            1823.060695,
            1983.525735,
            1889.437562,
            1889.672064,
            1737.827316,
            2744.407152,
            12050.20393,
        ],
        [
            1823.060695,
            1983.525735,
            1889.437562,
            1889.672064,
            1837.547162,
            2644.407152,
            12050.20393,
        ],
        [
            1823.060695,
            1983.525735,
            1889.437562,
            1889.672064,
            1937.325910,
            2544.407152,
            12050.20393,
        ],
    ]

    for i in range(len(total_lp)):
        pool = SwimPool(6, 2015, 0, 0, 1e-7, 100)
        pool.balances = [Decimal(balances[i][j]) for j in range(6)]
        depth = pool.depth()
        vp = depth / Decimal(total_lp[i])
        print(f"vp: {vp}, diff: {vp-Decimal(script_vp[i])}")


def testing():
    token_count = 6
    amp = 1000
    pool = SwimPool(token_count, amp, 0, 0)

    # balances = [100, 200, 300, 400, 500, 600]
    balances = [Decimal(1000) for _ in range(token_count)]
    balances[0] = Decimal(800)
    balances[1] = Decimal(1200)
    pool.balances = balances
    pool.lp_supply = pool._SwimPool__calc_depth(pool.balances)
    # swap_inputs = [2, 4, 6, 8, 10, 0]
    swap_inputs = [0, 5, 0, 0, 0, 0]
    index = 0
    lp_received, governance_mint_amount = pool.swap_exact_input(swap_inputs, index)
    print(
        f"swap_exact_input(amounts = {swap_inputs}, output_index = {index}) => {(lp_received,governance_mint_amount)}"
    )
    # print_pool(pool)

def imbalanced_testing():
    switch = 1
    diff = 19

    oom = 19-diff
    basic_amounts = (Decimal(10 ** (oom + diff)), Decimal(10 ** oom))
    amount1, amount2 = basic_amounts[:: (2 * switch - 1)]
    token_count = 6
    balances = [amount1] + [amount2] * (token_count - 1)
    amp = 1
    tolerance = 0.1
    max_iterations = 1000

    pool = SwimPool(token_count, amp, 0, 0, tolerance, max_iterations)
    pool.balances = balances
    print("balances:", balances)
    print("----------------------------------------------------------")
    depth = pool.depth()
    print(f"depth: {depth:.1f}")
    print("----------------------------------------------------------")
    print(f"missing balance[0]: {pool._SwimPool__calc_missing_balance(balances[1:], depth):.1f}")
    print("----------------------------------------------------------")
    print(f"missing balance[{token_count-1}]: {pool._SwimPool__calc_missing_balance(balances[:-1], depth):.1f}")


# imbalanced_testing()
#lan_virtual_price_decrease()
# testing()
# will_exact_compute_budget_limit()


def bit_usage():
  pool = SwimPool(3, Decimal("1"), Decimal("0"), Decimal("0"), Decimal("0.0000001"))
  testfee = Decimal("0.2")
  full_depth_add_no_fee = pool.ext_calc_depth([Decimal(2), Decimal(1), Decimal(1)]) - Decimal(3)
  full_depth_add_minus_fee = full_depth_add_no_fee * testfee
  #full_input_amount = pool.ext_calc_missing_balance(
  #    [Decimal(1), Decimal(1)],
  #    Decimal(3) + full_depth_add_minus_fee
  #) - Decimal(1)
  full_output_amount = Decimal(1) - pool.ext_calc_missing_balance(
      [Decimal(2), Decimal(1)],
      Decimal(3) + full_depth_add_minus_fee
  )

  split_depth_add_no_fee1 = pool.ext_calc_depth([Decimal(1.5), Decimal(1), Decimal(1)]) - Decimal(3)
  split_depth_add_minus_fee1 = split_depth_add_no_fee1 * testfee
  #split_input_amount1 = pool.ext_calc_missing_balance(
  #    [Decimal(1), Decimal(1)],
  #    Decimal(3) + split_depth_add_minus_fee1
  #) - Decimal(1)
  split_output_amount1 = Decimal(1) - pool.ext_calc_missing_balance(
      [Decimal(1.5), Decimal(1)],
      Decimal(3) + split_depth_add_minus_fee1
  )

  split_depth_add_no_fee2 = pool.ext_calc_depth([Decimal(2), Decimal(1), Decimal(1) - split_output_amount1]) - Decimal(3) + split_depth_add_minus_fee1
  split_depth_add_minus_fee2 = split_depth_add_no_fee2 * testfee
  #split_input_amount2 = pool.ext_calc_missing_balance(
  #    [Decimal(1), Decimal(1) - split_output_amount1],
  #    Decimal(3) + split_depth_add_minus_fee2
  #) - Decimal(1 + split_input_amount1)
  split_output_amount2 = (Decimal(1) - split_output_amount1) - pool.ext_calc_missing_balance(
      [Decimal(2), Decimal(1)],
      Decimal(3) + split_depth_add_minus_fee1 + split_depth_add_minus_fee2
  )

  #print("input")
  #print("split:", split_input_amount1 + split_input_amount2, " = ", split_input_amount1, " + ", split_input_amount2)
  #print(" full:", full_input_amount)

  #print("output")
  #print("split:", split_output_amount1 + split_output_amount2, " = ", split_output_amount1, " + ", split_output_amount2)
  #print(" full:", full_output_amount)

  #print(" comp:", pool.ext_calc_depth([Decimal(2), Decimal(1), Decimal(1) - full_output_amount]))
  #print(" comp:", pool.ext_calc_depth([Decimal(2), Decimal(1), Decimal(1) - split_output_amount1 - split_output_amount2]))

  #print(" comp:", pool.ext_calc_depth([Decimal(1) + full_input_amount, Decimal(1), Decimal(1) - full_output_amount]))
  #print(" comp:", pool.ext_calc_depth([Decimal(1) + split_input_amount1 + split_input_amount2, Decimal(1), Decimal(1) - split_output_amount1 - split_output_amount2]))

def wtf():
  amp_factor = Decimal(2000)
  lp_fee = Decimal("0.2")
  gov_fee = Decimal("0.2")
  tolerance = Decimal(0.1)
  pool = SwimPool(6, amp_factor, lp_fee, gov_fee, tolerance)
  base = Decimal(10)
  burn = Decimal(55)
  balances = [base for _ in range(6)]
  print("add:", pool.add(balances))
  print("burn amount:", burn)
  exact_burn_result = pool.remove_exact_burn(burn, 0)
  print("exact burn:", exact_burn_result)

  print("depth:", pool.depth())
  print("balances:", pool.balances)
  print("lp supply:", pool.lp_supply)

  print("-----------")

  pool = SwimPool(6, amp_factor, lp_fee, gov_fee, tolerance)
  remove = exact_burn_result[0]
  balances = [base for _ in range(6)]
  print("add:", pool.add(balances))
  print("remove amount:", remove)
  print("remove:", pool.remove_exact_output([remove] + [Decimal(0) for _ in range(5)], 0))
  print("depth:", pool.depth())
  print("balances:", pool.balances)
  print("lp supply:", pool.lp_supply)

imbalanced_testing()

