#!/usr/bin/env python3

from swim_invariant import SwimPool, Decimal

token_count = 3
amp_factor = Decimal("1.313")  # *Decimal(9)/Decimal(6**5)
lp_fee = Decimal("0.10")
governance_fee = Decimal("0.40")


def setup():
    pool = SwimPool(token_count, amp_factor, lp_fee, governance_fee)
    amounts = [150, 100, 50]
    pool.add(amounts, 0)
    return pool


def print_pool(pool):
    marginal_prices = pool.marginal_prices()
    depth = pool.depth()
    print(f"/--------------- pool ---------------")
    for i in range(len(pool.balances)):
        print(f"| {i}: {marginal_prices[i]:>11.5f} | {pool.balances[i]:>21.1f}")
    print(f"| lp_supply: {pool.lp_supply}")
    print(f"|     depth: {depth}")
    print(f"| depth/sum: {depth / sum(pool.balances)}")
    print(f"\\-----------------------------------")


def destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(
    pool, gov_mint_amount, token_index
):
    pool._SwimPool__total_fee = Decimal(0)
    pool.governance_fee = Decimal(0)
    pool.lp_fee = Decimal(0)
    first_remove, _ = pool.remove_exact_burn(gov_mint_amount, token_index)
    second_remove, _ = pool.remove_exact_burn(gov_mint_amount, token_index)
    print("> fee consistency check (only valid if lp_fee == governance_fee):")
    print(">   first remove netted:", first_remove)
    print(">  second remove netted:", second_remove)
    print(
        "> sum (should be equal fee amount calculated above):",
        first_remove + second_remove,
    )


def one_vs_two_add():
    pool1 = setup()
    amounts = [15, 10, 5]
    print_pool(pool1)
    single_lp, single_governance_mint_amount = pool1.add(amounts)
    print(f"== add({amounts}): {single_lp}, {single_governance_mint_amount}")
    pool2 = setup()
    half_amounts = [amount / 2 for amount in amounts]
    print_pool(pool2)
    first_lp, first_governance_mint_amount = pool2.add(half_amounts)
    print(f"== add({half_amounts}): {first_lp}, {first_governance_mint_amount}")
    print_pool(pool2)
    second_lp, second_governance_mint_amount = pool2.add(half_amounts)
    print(f"== add({half_amounts}): {second_lp}, {second_governance_mint_amount}")
    print(
        f"sums: {first_lp+second_lp}, {first_governance_mint_amount+second_governance_mint_amount}"
    )
    print("DDDDDDDDDDDDDDDDDD differences (first-second):")
    print("D     lp received:", single_lp - (first_lp + second_lp))
    print(
        "D  governance fee:",
        single_governance_mint_amount
        - (first_governance_mint_amount + second_governance_mint_amount),
    )
    print("DDDDDDDDDDDDDDDDDD")


def one_vs_two_swap():
    pool1 = setup()
    amounts = [0, pool1.balances[1] / 2] + [0] * (token_count - 2)
    print_pool(pool1)
    single_received, single_governance_mint_amount = pool1.swap_exact_input(amounts, 0)
    print(
        f"== swap_exact_input({amounts, 0}): {single_received}, {single_governance_mint_amount}"
    )
    pool2 = setup()
    amounts[1] = amounts[1] / 2
    print_pool(pool2)
    first_received, first_governance_mint_amount = pool2.swap_exact_input(amounts, 0)
    print(
        f"== swap_exact_input({amounts, 0}): {first_received}, {first_governance_mint_amount}"
    )
    print_pool(pool2)
    second_received, second_governance_mint_amount = pool2.swap_exact_input(amounts, 0)
    print(
        f"== swap_exact_input({amounts, 0}): {second_received}, {second_governance_mint_amount}"
    )
    print(
        f"sums: {first_received+second_received}, {first_governance_mint_amount+second_governance_mint_amount}"
    )
    print("DDDDDDDDDDDDDDDDDD differences (first-second):")
    print("D amount received:", single_received - (first_received + second_received))
    print(
        "D  governance fee:",
        single_governance_mint_amount
        - (first_governance_mint_amount + second_governance_mint_amount),
    )
    print("DDDDDDDDDDDDDDDDDD")


def balanced_and_imbalanced_vs_together(is_add):
    op = SwimPool.add if is_add else SwimPool.remove_exact_output

    pool1 = setup()
    balanced_amounts = [balance / 2 for balance in pool1.balances]
    imbalanced_amounts = [pool1.balances[0] / 4] + [0] * (token_count - 1)

    print_pool(pool1)
    first_lp, first_governance_mint_amount = op(pool1, balanced_amounts)
    print(
        f"== {op.__name__}({balanced_amounts}): {first_lp}, {first_governance_mint_amount}"
    )
    print_pool(pool1)
    second_lp, second_governance_mint_amount = op(pool1, imbalanced_amounts)
    print(
        f"== {op.__name__}({imbalanced_amounts}): {second_lp}, {second_governance_mint_amount}"
    )
    print_pool(pool1)

    together_amounts = [
        balanced_amounts[i] + imbalanced_amounts[i] for i in range(token_count)
    ]
    pool2 = setup()
    print_pool(pool2)
    together_lp, together_governance_mint_amount = op(pool2, together_amounts)
    print(
        f"== {op.__name__}({together_amounts}): {together_lp}, {together_governance_mint_amount}"
    )
    print_pool(pool2)

    print("DDDDDDDDDDDDDDDDDD differences (first-second):")
    print("D     lp received:", (first_lp + second_lp) - together_lp)
    print(
        "D  governance fee:",
        (first_governance_mint_amount + second_governance_mint_amount)
        - together_governance_mint_amount,
    )
    print("DDDDDDDDDDDDDDDDDD")


def balanced_and_imbalanced_vs_together_add():
    balanced_and_imbalanced_vs_together(True)


def balanced_and_imbalanced_vs_together_remove():
    balanced_and_imbalanced_vs_together(False)


def swap_exact_in_vs_exact_out():
    pool1 = setup()
    amount = 50
    amounts = [0, amount] + [0] * (token_count - 2)
    print_pool(pool1)
    swap_in_amount, swap_in_governance_mint_amount = pool1.swap_exact_input(amounts, 0)
    print(
        f"== swap_exact_input({amounts}, 0): {swap_in_amount}, {swap_in_governance_mint_amount}"
    )
    print_pool(pool1)
    destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(
        pool1, swap_in_governance_mint_amount, 1
    )

    pool2 = setup()
    amounts = [swap_in_amount, 0] + [0] * (token_count - 2)
    print_pool(pool2)
    swap_out_amount, swap_out_governance_mint_amount = pool2.swap_exact_output(
        1, amounts
    )
    print(
        f"== swap_exact_input(1, {amounts}): {swap_out_amount}, {swap_out_governance_mint_amount}"
    )
    print_pool(pool2)
    destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(
        pool2, swap_out_governance_mint_amount, 1
    )

    print("DDDDDDDDDDDDDDDDDD differences (first-second):")
    print("D         amounts:", 50 - swap_out_amount)
    print(
        "D  governance fee:",
        swap_in_governance_mint_amount - swap_out_governance_mint_amount,
    )
    print("DDDDDDDDDDDDDDDDDD")


def swap_vs_add_remove():
    amounts = [50, 20, 0]
    pool1 = setup()
    print_pool(pool1)
    swap_received, swap_governance_mint_amount = pool1.swap_exact_input(amounts, 2)
    print(
        f"== swap_exact_input({amounts}, 2): {swap_received}, {swap_governance_mint_amount}"
    )
    print_pool(pool1)
    pool2 = setup()
    print_pool(pool2)
    lp_amount, add_governance_mint_amount = pool2.add(amounts)
    print(f"== add({amounts}): {lp_amount}, {add_governance_mint_amount}")
    print_pool(pool2)
    remove_received, remove_governance_mint_amount = pool2.remove_exact_burn(
        lp_amount, 2
    )
    print(
        f"== remove_exact_burn({lp_amount}, 2): {remove_received}, {remove_governance_mint_amount}"
    )
    print_pool(pool2)
    print("DDDDDDDDDDDDDDDDDD differences (first-second):")
    print("D     stable coin:", swap_received - remove_received)
    print(
        "D  governance fee:",
        swap_governance_mint_amount
        - (add_governance_mint_amount + remove_governance_mint_amount),
    )
    print("DDDDDDDDDDDDDDDDDD")


def add_remove_marginal_consistency():
    eps = Decimal("0.1")
    pool1 = setup()
    # same amount for add and remove
    # input, output = eps, eps
    # make results comparable:
    input, output = eps / (1 - pool1._SwimPool__total_fee), eps
    # input, output = eps, eps * (1-pool1._SwimPool__total_fee)

    amounts = [input] + [Decimal(0)] * (token_count - 1)
    add_lp_received, add_governance_mint_amount = pool1.add(amounts)
    print(f"== add({amounts}): {add_lp_received}, {add_governance_mint_amount}")
    print_pool(pool1)

    pool2 = setup()
    amounts = [output] + [Decimal(0)] * (token_count - 1)
    remove_lp_required, remove_governance_mint_amount = pool2.remove_exact_output(
        amounts
    )
    print(
        f"== remove_exact_output({amounts}): {remove_lp_required}, {remove_governance_mint_amount}"
    )
    print_pool(pool2)
    print("===== results:")
    print(".    lp received:", add_lp_received)
    print(".    lp required:", remove_lp_required)
    print(".    add gov fee:", add_governance_mint_amount)
    print(". remove gov fee:", remove_governance_mint_amount)
    print("DDDDDDDDDDDDDDDDDD differences (first-second):")
    print(
        "D       lp amount:",
        add_lp_received + add_governance_mint_amount - remove_lp_required,
    )
    print(
        "D  governance fee:", add_governance_mint_amount - remove_governance_mint_amount
    )
    print("DDDDDDDDDDDDDDDDDD")


def remove_consistency():
    pool1 = setup()
    amounts = [
        balance / 10 if i == 0 else 0 for i, balance in enumerate(pool1.balances)
    ]
    print_pool(pool1)
    lp_amount, first_governance_mint_amount = pool1.remove_exact_output(amounts)
    print(
        f"== remove_exact_output({amounts}) = {lp_amount} {first_governance_mint_amount}"
    )
    print_pool(pool1)
    # destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(pool1, first_governance_mint_amount, 0)
    pool2 = setup()
    print_pool(pool2)
    sc_amount, second_governance_mint_amount = pool2.remove_exact_burn(lp_amount, 0)
    print(
        f"== remove_exact_burn({lp_amount}) = {sc_amount} {second_governance_mint_amount}"
    )
    print_pool(pool2)
    # destructively_check_fee_consistency_if_lp_fee_is_equal_gov_fee(pool2, second_governance_mint_amount, 0)
    print("DDDDDDDDDDDDDDDDDD differences")
    print("D     stable coin:", amounts[0] - sc_amount)
    print(
        "D  governance fee:",
        first_governance_mint_amount - second_governance_mint_amount,
    )
    print("DDDDDDDDDDDDDDDDDD")


def marginal_price_vs_lp_per_balanced():
    pool = SwimPool(token_count, amp_factor, Decimal(0), Decimal(0))
    amounts = [30, 20, 10]
    pool.add(amounts, 0)
    lp_per_balanced_dollar = pool.lp_supply / sum(pool.balances)
    add = [
        Decimal(3) * pool.balances[i] / sum(pool.balances)
        for i in range(pool.token_count)
    ]
    marginal_prices = pool.marginal_prices()
    print(
        ".  should be zero:",
        lp_per_balanced_dollar
        - sum(
            [
                marginal_prices[i] * pool.balances[i] / sum(pool.balances)
                for i in range(pool.token_count)
            ]
        ),
    )
    lp_received, _ = pool.add(add, 0)
    amount_added = lp_received / lp_per_balanced_dollar
    print(".     lp_received:", lp_received)
    print(".    amount_added:", amount_added)


def check_marginal_prices():
    pool = SwimPool(token_count, amp_factor, lp_fee, governance_fee)
    amounts = [1, 10, 19] + [10] * (token_count - 3)
    print(pool.add(amounts, 0))
    marginal_prices = pool.marginal_prices()
    depth = pool.depth()
    prices_times_balances = [
        price * balance for price, balance in zip(marginal_prices, pool.balances)
    ]
    print(".   marginal prices:", marginal_prices)
    print(
        ". * n / sum(prices):",
        [price * token_count / sum(marginal_prices) for price in marginal_prices],
    )
    print(".     pool balances:", pool.balances)
    print(". prices * balances:", prices_times_balances)
    print(".   and finally sum:", sum(prices_times_balances))
    print(".        pool depth:", depth)

    amounts, index = ([marginal_prices[1]] + [0] * (token_count - 1), 1)
    print(
        f"swap_exact_input(amounts = {amounts}, output_index = {index}) => {pool.swap_exact_input(amounts, index)}"
    )
    amounts, index = ([0, marginal_prices[0]] + [0] * (token_count - 2), 0)
    print(
        f"swap_exact_input(amounts = {amounts}, output_index = {index}) => {pool.swap_exact_input(amounts, index)}"
    )


def expensive_add():
    token_count = 6
    amp = 1000
    pool = SwimPool(token_count, amp, 3e-4, 1e-4)

    balances = [
        285_135_486_931_48700,
        85_767_684_566_75700,
        35_465_343_546_53400,
        88_379_798_798_79100,
        31_864_684_138_47112,
        57_547_945_282_97897,
    ]
    pool.balances = balances
    pool.lp_supply = pool._SwimPool__calc_depth(pool.balances)
    print_pool(pool)

    input_amounts = [843_435_468_497_79600, 0, 0, 0, 0, 0]
    add_lp_received, add_governance_mint_amount = pool.add(input_amounts)
    print(f"== add({input_amounts}): {add_lp_received}, {add_governance_mint_amount}")
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
tests.append(remove_consistency)
for test in tests:
    print("\n>>>>>>>>>>>>>>>>>>>>", test.__name__)
    test()
    print("")
