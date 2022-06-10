#!/usr/bin/env python3

from swim_invariant import SwimPool, Decimal

defaults = {
  "balances": [150, 100, 50],
  "amp_factor": Decimal("1.313"),
  "lp_fee": Decimal("0.10"),
  "governance_fee": Decimal("0.20"),
  "tolerance": Decimal(0.5)*Decimal(10)**-8, #assume 8 decimals
  "max_iterations": 50
}

def amnt_str(amounts, fmt=".1f"):
  return "[" + ", ".join([f"{amount:{fmt}}" for amount in amounts]) + "]"

def setup(
    balances_or_token_count = defaults["balances"],
    amp_factor = defaults["amp_factor"],
    lp_fee = defaults["lp_fee"],
    governance_fee = defaults["governance_fee"],
    tolerance = defaults["tolerance"],
    max_iterations = defaults["max_iterations"]
  ):
  if type(balances_or_token_count) is list:
    balances = balances_or_token_count
    token_count = len(balances_or_token_count)
  else:
    balances = None
    token_count = balances_or_token_count

  pool = SwimPool(token_count, amp_factor, lp_fee, governance_fee, tolerance, max_iterations)
  if balances:
    pool.add(balances, 0)

  return pool


def print_pool(pool):
  marginal_prices = pool.marginal_prices()
  depth = pool.depth()
  print(f"/--------------- pool ---------------")
  print(f"|          balance   marginal price")
  for i in range(len(pool.balances)):
    print(f"|         {i}: {pool.balances[i]:>5.1f} | {marginal_prices[i]:>7.3f}")
  print(f"|-----------")
  print(f"| lp_supply: {pool.lp_supply:>7.3f}")
  print(f"|     depth: {depth:>7.3f}")
  print(f"| depth/sum: {depth / sum(pool.balances):>7.3f}")
  print(f"\\------------------------------------")


def destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(pool, gov_mint_amount, token_index):
  pool._SwimPool__total_fee = Decimal(0)
  pool.governance_fee = Decimal(0)
  pool.lp_fee = Decimal(0)
  first_remove, _ = pool.remove_exact_burn(gov_mint_amount, token_index)
  second_remove, _ = pool.remove_exact_burn(gov_mint_amount, token_index)
  print(f"> fee consistency check (only valid if lp_fee == governance_fee):")
  print(f">   first remove netted: {first_remove:>7.3f}")
  print(f">  second remove netted: {second_remove:>7.3f}")
  print(f">                summed: {first_remove+second_remove:>7.3f} (should be equal fee amount calculated above)")


def one_vs_two_add():
  amounts = [15, 10, 5]

  pool1 = setup()
  print_pool(pool1)
  single_lp, single_governance_mint_amount = pool1.add(amounts)
  print(f"== add({amnt_str(amounts)}):")
  print(f"==             lp received: {single_lp:>7.3f}")
  print(f"==                 gov fee: {single_governance_mint_amount:>7.3f}")
  print(f"==")

  print(f"> vs")
  pool2 = setup()
  half_amounts = [amount / 2 for amount in amounts]
  first_lp, first_governance_mint_amount = pool2.add(half_amounts)
  print(f"== add({amnt_str(half_amounts)}")
  print(f"==             lp received: {first_lp:>7.3f}")
  print(f"==                 gov fee: {first_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool2)
  second_lp, second_governance_mint_amount = pool2.add(half_amounts)
  print(f"== add({amnt_str(half_amounts)}")
  print(f"==             lp received: {second_lp:>7.3f}")
  print(f"==                 gov fee: {second_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool2)
  print(f"> sums:")
  print(f">      lp amounts: {first_lp + second_lp:>7.3f}")
  print(f">        gov fees: {first_governance_mint_amount + second_governance_mint_amount:>7.3f}")

  print(f"DDDDDDDDDDDDDDDDDD differences:")
  print(f"D     lp received: {single_lp - (first_lp + second_lp):>7.3f}")
  print(f"D  governance fee: {single_governance_mint_amount - (first_governance_mint_amount + second_governance_mint_amount):>7.3f}")
  print(f"DDDDDDDDDDDDDDDDDD")


def one_vs_two_swap():
  pool1 = setup()
  amounts = [0, pool1.balances[1] / 2] + [0] * (pool1.token_count - 2)
  print_pool(pool1)
  single_received, single_governance_mint_amount = pool1.swap_exact_input(amounts, 0)
  print(f"== swap_exact_input({amnt_str(amounts)}, 0):")
  print(f"==         stable received: {single_received:>7.3f}")
  print(f"==                 gov fee: {single_governance_mint_amount:>7.3f}")
  print(f"==")

  print(f"> vs")
  pool2 = setup()
  amounts[1] = amounts[1] / 2
  first_received, first_governance_mint_amount = pool2.swap_exact_input(amounts, 0)
  print(f"== swap_exact_input({amnt_str(amounts)}, 0):")
  print(f"==         stable received: {first_received:>7.3f}")
  print(f"==                 gov fee: {first_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool2)
  second_received, second_governance_mint_amount = pool2.swap_exact_input(amounts, 0)
  print(f"== swap_exact_input({amnt_str(amounts)}, 0):")
  print(f"==         stable received: {second_received:>7.3f}")
  print(f"==                 gov fee: {second_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool2)

  print(f"> sums:")
  print(f">      lp amounts: {first_received + second_received:>7.3f}")
  print(f">        gov fees: {first_governance_mint_amount + second_governance_mint_amount:>7.3f}")

  print(f"DDDDDDDDDDDDDDDDDD differences:")
  print(f"D amount received: {single_received - (first_received + second_received):>7.3f}")
  print(f"D  governance fee: {single_governance_mint_amount - (first_governance_mint_amount + second_governance_mint_amount):>7.3f}")
  print(f"DDDDDDDDDDDDDDDDDD")


def balanced_and_imbalanced_vs_together(is_add):
  op = SwimPool.add if is_add else SwimPool.remove_exact_output

  pool1 = setup()
  balanced_amounts = [balance / 2 for balance in pool1.balances]
  imbalanced_amounts = [pool1.balances[0] / 4] + [0] * (pool1.token_count - 1)

  print_pool(pool1)
  first_lp, first_governance_mint_amount = op(pool1, balanced_amounts)
  print(f"== {op.__name__}({amnt_str(balanced_amounts)}):")
  print(f"==               lp amount: {first_lp:>7.3f}")
  print(f"==                 gov fee: {first_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool1)
  second_lp, second_governance_mint_amount = op(pool1, imbalanced_amounts)
  print(f"== {op.__name__}({amnt_str(imbalanced_amounts)}):")
  print(f"==               lp amount: {second_lp:>7.3f}")
  print(f"==                 gov fee: {second_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool1)

  print(f"> vs")
  pool2 = setup()
  together_amounts = [balanced_amounts[i] + imbalanced_amounts[i] for i in range(pool2.token_count)]
  together_lp, together_governance_mint_amount = op(pool2, together_amounts)
  print(f"== {op.__name__}({amnt_str(together_amounts)}):")
  print(f"==               lp amount: {together_lp:>7.3f}")
  print(f"==                 gov fee: {together_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool2)

  print(f"> sums:")
  print(f">      lp amounts: {first_lp + second_lp:>7.3f}")
  print(f">        gov fees: {first_governance_mint_amount + second_governance_mint_amount:>7.3f}")

  print(f"DDDDDDDDDDDDDDDDDD differences:")
  print(f"D     lp received: {(first_lp + second_lp) - together_lp:>7.3f}")
  print(f"D  governance fee: {first_governance_mint_amount + second_governance_mint_amount - together_governance_mint_amount:>7.3f}")
  print(f"DDDDDDDDDDDDDDDDDD")


def balanced_and_imbalanced_vs_together_add():
  balanced_and_imbalanced_vs_together(True)


def balanced_and_imbalanced_vs_together_remove():
  balanced_and_imbalanced_vs_together(False)


def swap_exact_in_vs_exact_out():
  amount = 50

  pool1 = setup()
  print_pool(pool1)
  amounts = [0, amount] + [0] * (pool1.token_count - 2)
  swap_in_amount, swap_in_governance_mint_amount = pool1.swap_exact_input(amounts, 0)
  print(f"== swap_exact_input({amnt_str(amounts)}, 0):")
  print(f"==         stable received: {swap_in_amount:>7.3f}")
  print(f"==                 gov fee: {swap_in_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool1)
  # destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(pool1, swap_in_governance_mint_amount, 1)

  print(f"> vs")
  pool2 = setup()
  amounts = [swap_in_amount, 0] + [0] * (pool2.token_count - 2)
  swap_out_amount, swap_out_governance_mint_amount = pool2.swap_exact_output(1, amounts)
  print(f"== swap_exact_output(1, {amnt_str(amounts)}):")
  print(f"==         stable required: {swap_out_amount:>7.3f}")
  print(f"==                 gov fee: {swap_out_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool2)
  # destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(pool2, swap_out_governance_mint_amount, 1)

  print(f"DDDDDDDDDDDDDDDDDD differences:")
  print(f"D         amounts: {amount - swap_out_amount:>7.3f}")
  print(f"D  governance fee: {swap_in_governance_mint_amount - swap_out_governance_mint_amount:>7.3f}")
  print(f"DDDDDDDDDDDDDDDDDD")


def swap_vs_add_remove():
  amounts = [50, 20, 0]
  swap_index = 2

  pool1 = setup()
  print_pool(pool1)
  swap_received, swap_governance_mint_amount = pool1.swap_exact_input(amounts, swap_index)
  print(f"== swap_exact_input({amnt_str(amounts)}, {swap_index}):")
  print(f"==         stable received: {swap_received:>7.3f}")
  print(f"==                 gov fee: {swap_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool1)

  print(f"> vs")
  pool2 = setup()
  lp_amount, add_governance_mint_amount = pool2.add(amounts)
  print(f"== add({amnt_str(amounts)}):")
  print(f"==             lp received: {lp_amount:>7.3f}")
  print(f"==                 gov fee: {add_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool2)
  remove_received, remove_governance_mint_amount = pool2.remove_exact_burn(lp_amount, swap_index)
  print(f"== remove_exact_burn({lp_amount:.3f}, {swap_index}):")
  print(f"==         stable received: {remove_received:>7.3f}")
  print(f"==                 gov fee: {remove_governance_mint_amount:>7.3f}")
  print(f"==")
  print_pool(pool2)

  print(f"> sums:")
  print(f">        gov fees: {add_governance_mint_amount + remove_governance_mint_amount:>7.3f}")

  print(f"DDDDDDDDDDDDDDDDDD differences:")
  print(f"D     stable coin: {swap_received - remove_received:>7.3f}")
  print(f"D  governance fee: {swap_governance_mint_amount - (add_governance_mint_amount + remove_governance_mint_amount):>7.3f}")
  print(f"DDDDDDDDDDDDDDDDDD")


def add_remove_marginal_consistency():
  eps = Decimal("0.1")
  # same amount for add and remove
  # input, output = eps, eps
  # make results comparable:
  input, output = eps / (1 - (defaults["lp_fee"] + defaults["governance_fee"])), eps
  # input, output = eps, eps * (1 - (defaults["lp_fee"]+defaults["governance_fee"]))

  pool1 = setup()
  amounts = [input] + [Decimal(0)] * (pool1.token_count - 1)
  add_lp_received, add_governance_mint_amount = pool1.add(amounts)
  print(f"== add({amnt_str(amounts)}):")
  print(f"==             lp received: {add_lp_received:>7.5f}")
  print(f"==                 gov fee: {add_governance_mint_amount:>7.5f} (= {add_governance_mint_amount/pool1.lp_supply* Decimal(100):.1f} % of lp supply)")
  print(f"==")
  print_pool(pool1)

  print(f"> vs")
  pool2 = setup()
  amounts = [output] + [Decimal(0)] * (pool2.token_count - 1)
  remove_lp_required, remove_governance_mint_amount = pool2.remove_exact_output(amounts)
  print(f"== remove_exact_output({amnt_str(amounts)}):")
  print(f"==             lp required: {remove_lp_required:>7.5f}")
  print(f"==                 gov fee: {remove_governance_mint_amount:>7.5f} (= {remove_governance_mint_amount/pool2.lp_supply* Decimal(100):.1f} % of lp supply)")
  print(f"==")
  print_pool(pool2)

  print(f"DDDDDDDDDDDDDDDDDD differences:")
  print(f"D       lp amount: {add_lp_received - remove_lp_required:>7.5f}")
  print(f"D  governance fee: {add_governance_mint_amount - remove_governance_mint_amount:>7.5f}")
  print(f"D govLpShareRatio: {(add_governance_mint_amount/pool1.lp_supply) / (remove_governance_mint_amount/pool2.lp_supply):>7.5f}")
  print(f"DDDDDDDDDDDDDDDDDD")


def remove_burn_consistency():
  percentage = Decimal("0.82")

  pool1 = setup()
  amounts = [balance * percentage if i == 0 else 0 for i, balance in enumerate(pool1.balances)]
  print_pool(pool1)
  lp_amount, first_governance_mint_amount = pool1.remove_exact_output(amounts)
  print(f"== remove_exact_output({amnt_str(amounts)}):")
  print(f"==             lp required: {lp_amount:>7.3f}")
  print(f"==                 gov fee: {first_governance_mint_amount:>7.3f} (= {first_governance_mint_amount/pool1.lp_supply* Decimal(100):.1f} % of lp supply)")
  print(f"==")
  print_pool(pool1)
  # destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(pool1, first_governance_mint_amount, 0)

  print(f"> vs")
  pool2 = setup()
  sc_amount, second_governance_mint_amount = pool2.remove_exact_burn(lp_amount, 0)
  print(f"== remove_exact_burn({lp_amount:.3f}, 0):")
  print(f"==         stable received: {sc_amount:>7.3f}")
  print(f"==                 gov fee: {second_governance_mint_amount:>7.3f} (= {second_governance_mint_amount/pool2.lp_supply* Decimal(100):.1f} % of lp supply)")
  print_pool(pool2)
  # destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(pool2, second_governance_mint_amount, 0)

  print(f"DDDDDDDDDDDDDDDDDD differences:")
  print(f"D   stable amount: {amounts[0] - sc_amount:>7.3f}")
  print(f"D  governance fee: {first_governance_mint_amount - second_governance_mint_amount:>7.3f}")
  print(f"D govLpShareRatio: {(first_governance_mint_amount/pool1.lp_supply) / (second_governance_mint_amount/pool2.lp_supply):>7.3f}")
  print(f"DDDDDDDDDDDDDDDDDD")


def burn_remove_consistency():
  burn_ratio = Decimal("0.5")

  pool1 = setup()
  burn_amount = pool1.lp_supply * burn_ratio
  print_pool(pool1)
  sc_amount, first_governance_mint_amount = pool1.remove_exact_burn(burn_amount, 0)
  print(f"== remove_exact_burn({burn_amount:.3f}, 0):")
  print(f"==         stable received: {sc_amount:>7.3f}")
  print(f"==                 gov fee: {first_governance_mint_amount:>7.3f} (= {first_governance_mint_amount/pool1.lp_supply* Decimal(100):.1f} % of lp supply)")
  print(f"==")
  print_pool(pool1)
  # destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(pool1, first_governance_mint_amount, 0)

  print(f"> vs")
  pool2 = setup()
  amounts = [sc_amount] + [Decimal(0) for _ in range(pool2.token_count -1)]
  lp_amount, second_governance_mint_amount = pool2.remove_exact_output(amounts)
  print(f"== remove_exact_output({amnt_str(amounts)}):")
  print(f"==             lp required: {lp_amount:>7.3f}")
  print(f"==                 gov fee: {second_governance_mint_amount:>7.3f} (= {second_governance_mint_amount/pool2.lp_supply* Decimal(100):.1f} % of lp supply)")
  print(f"==")
  print_pool(pool2)
  # destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(pool2, second_governance_mint_amount, 0)

  print(f"DDDDDDDDDDDDDDDDDD differences:")
  print(f"D       lp amount: {burn_amount - lp_amount:>7.3f}")
  print(f"D  governance fee: {first_governance_mint_amount - second_governance_mint_amount:>7.3f}")
  print(f"D govLpShareRatio: {(first_governance_mint_amount/pool1.lp_supply) / (second_governance_mint_amount/pool2.lp_supply):>7.3f}")
  print(f"DDDDDDDDDDDDDDDDDD")


def marginal_price_vs_lp_per_balanced():
  amounts = [30, 20, 10]
  balances_amounts_factor = Decimal(3)

  pool = setup(lp_fee=Decimal(0), governance_fee=Decimal(0))
  pool.add(amounts, 0)
  lp_per_balanced_dollar = pool.lp_supply / sum(pool.balances)
  balanced_amounts = [balances_amounts_factor * pool.balances[i] / sum(pool.balances) for i in range(pool.token_count)]
  marginal_prices = pool.marginal_prices()
  mp_prod = sum([marginal_prices[i] * pool.balances[i] / sum(pool.balances) for i in range(pool.token_count)])
  print(f".  should be zero: {lp_per_balanced_dollar - mp_prod:>7.3f}")
  lp_received, _ = pool.add(balanced_amounts, 0)
  amount_added = lp_received / lp_per_balanced_dollar
  print(f".     lp_received: {lp_received:>7.3f}")
  print(f".    amount_added: {amount_added:>7.3f}")


def check_marginal_prices():
  token_count = 3
  balances = [1, 10, 19] + [10] * (token_count - 3)

  pool = setup(balances_or_token_count=balances)
  marginal_prices = pool.marginal_prices()
  depth = pool.depth()
  prices_times_balances = [price * balance for price, balance in zip(marginal_prices, pool.balances)]
  print(f".   marginal prices: {amnt_str(marginal_prices,'>6.3f')}")
  print(f". * n / sum(prices): {amnt_str([price * token_count / sum(marginal_prices) for price in marginal_prices],'>6.3f')}")
  print(f".     pool balances: {amnt_str(pool.balances,'>4.1f')}")
  print(f". prices * balances: {amnt_str(prices_times_balances,'>4.1f')}")
  print(f".   and finally sum: {sum(prices_times_balances):>7.3f}")
  print(f".        pool depth: {depth:>7.3f}")

  amounts, index = ([marginal_prices[1]] + [0] * (token_count - 1), 1)
  output_amount, gov_fee = pool.swap_exact_input(amounts, index)
  print(f"== swap_exact_input({amnt_str(amounts)}, {index}) => {output_amount:.3f} {gov_fee:.3f}")
  amounts, index = ([0, marginal_prices[0]] + [0] * (token_count - 2), 0)
  output_amount, gov_fee = pool.swap_exact_input(amounts, index)
  print(f"== swap_exact_input({amnt_str(amounts)}, {index}) => {output_amount:.3f} {gov_fee:.3f}")


def expensive_add():
  to_decimal = lambda amount: Decimal(amount) / Decimal(10)**15

  balances = [
    to_decimal(balance) for balance in [
      285_135_486_931_48700,
      85_767_684_566_75700,
      35_465_343_546_53400,
      88_379_798_798_79100,
      31_864_684_138_47112,
      57_547_945_282_97897,
    ]
  ]
  input_amount = to_decimal(843_435_468_497_79600)

  pool = setup(
    balances_or_token_count=balances,
    amp_factor=Decimal("1000"),
    lp_fee=Decimal("0.0003"),
    governance_fee=Decimal("0.0001")
  )
  print_pool(pool)
  input_amounts = [input_amount] + [0] * (len(balances)-1)
  add_lp_received, add_governance_mint_amount = pool.add(input_amounts)
  print(f"== add({amnt_str(input_amounts)}): {add_lp_received:.1f}, {add_governance_mint_amount:.3f}")
  print_pool(pool)


tests = []
tests.append(expensive_add)
tests.append(one_vs_two_add)
tests.append(one_vs_two_swap)
tests.append(swap_vs_add_remove)
tests.append(marginal_price_vs_lp_per_balanced)
tests.append(check_marginal_prices)
tests.append(add_remove_marginal_consistency)
tests.append(balanced_and_imbalanced_vs_together_add)
tests.append(balanced_and_imbalanced_vs_together_remove)
tests.append(swap_exact_in_vs_exact_out)
tests.append(remove_burn_consistency)
tests.append(burn_remove_consistency)
for test in tests:
  print("\n>>>>>>>>>>>>>>>>>>>>", test.__name__)
  test()
  print("")
