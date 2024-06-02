#!/usr/bin/env python3

from swim_invariant import SwimPool, Decimal

token_count = 2
amp_factor = Decimal(10)
lp_fee = Decimal("0.0003")
gov_fee = Decimal("0.0001")
tolerance = Decimal("0.000001")
base = Decimal(1000000)
abort_search_factor = Decimal("0.00000001")
search_step = Decimal("0.01")
initial_guess = base * Decimal("0.001")

def setup():
  balances = [Decimal(base) for _ in range(token_count)]
  pool = SwimPool(token_count, amp_factor, lp_fee, gov_fee, tolerance)
  pool.add(balances)
  return pool

def swap(pool, amount, index):
  input = [Decimal(0) for _ in range(token_count)]
  input[index] = amount
  return pool.swap_exact_input(input, 0 if index == 1 else 1)[0]

def frontrun(swap_amount, fr_amount, debug=False):
  pool = setup()
  fr_pre = swap(pool, fr_amount, 0)
  user_output = swap(pool, swap_amount, 0)
  fr_post = swap(pool, fr_pre, 1)
  fr_profit = fr_post - fr_amount
  if debug:
    print(f"     user input: {swap_amount:>10.5f}")
    print(f"    user output: {user_output:>10.5f}")
    print(f"frontrun amount: {fr_amount:>10.5f}")
    print(f"frontrun    pre: {fr_pre:>10.5f}")
    print(f"frontrun   post: {fr_post:>10.5f}")
    print(f"frontrun profit: {fr_profit:>10.5f}")
    print("---------------------")
  return [fr_profit, user_output]

def profitability_threshold(swap_amount, debug=False):
  fr_amount = swap_amount
  while True:
    [fr_profit, user_output] = frontrun(swap_amount, fr_amount, debug)
    if fr_profit > 0:
      return fr_amount
    if user_output < swap_amount * abort_search_factor:
      return -1
    fr_amount *= Decimal(1) + search_step

swap_amount = initial_guess
search_direction = -1 if profitability_threshold(swap_amount) > 0 else 1
while True:
  fr_amount = profitability_threshold(swap_amount)
  if search_direction == -1 and fr_amount == -1:
    break
  if search_direction == 1 and fr_amount > 0:
    swap_amount *= 1 / (Decimal(1) + search_direction * search_step)
    break
  if fr_amount == -1:
    print(f"{100*swap_amount/base:.4f} % is not exploitable")
  else:
    print(f"{100*swap_amount/base:.4f} % exploitable with {100*fr_amount/base:.2f} %")
  swap_amount *= Decimal(1) + search_direction * search_step

fr_amount = profitability_threshold(swap_amount / (Decimal(1) + search_direction * search_step), True)
print()
print("given:")
print(f"  token count: {token_count}")
print(f"pool balances: {base} each")
print(f"   amp factor: {amp_factor}")
print(f"    total fee: {int((lp_fee+gov_fee)*10000)} bips")
print(f"then a swap of {swap_amount:.2f} ({100*swap_amount/base:.3f} % of a pool balance) " +
  "is unexploitable\n")
