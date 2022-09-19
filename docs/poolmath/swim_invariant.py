import math
from decimal import *

getcontext().prec = 28

toBitsValueString = lambda val: format(
    f"bits: {int(math.ceil(math.log(val)/math.log(2))):>4}, value: {val:>50.10f}"
)

class SwimPool:
  def __init__(
    self,
    token_count,
    amp_factor,
    lp_fee,
    governance_fee,
    tolerance=0.5,
    max_iterations=20,
  ):
    self.token_count = token_count
    self.amp_factor = amp_factor
    self.lp_fee = Decimal(lp_fee)
    self.governance_fee = Decimal(governance_fee)
    self.__total_fee = self.lp_fee + self.governance_fee
    self.balances = [Decimal(0) for _ in range(token_count)]
    self.lp_supply = Decimal(0)
    self.tolerance = Decimal(tolerance)
    self.max_iterations = max_iterations

  def depth(self):
    return self.__calc_depth(self.balances)

  def marginal_prices(self):
    depth = self.depth()
    if self.amp_factor == 0:
      fixed = depth * depth / (self.token_count * self.lp_supply)
      return [fixed / balance for balance in self.balances]

    reciprocal_decay = Decimal(1)
    for balance in self.balances:
      reciprocal_decay *= depth / (self.token_count * balance)
    fixed1 = depth * reciprocal_decay
    denominator = (self.amp_factor - 1) + (self.token_count + 1) * reciprocal_decay
    pricedInLp = depth / self.lp_supply
    fixed2 = denominator / pricedInLp
    return [(self.amp_factor + fixed1 / balance) / fixed2 for balance in self.balances]

  def swap_exact_input(self, input_amounts, output_index, min_output_amount=0):
    return self.__swap(True, input_amounts, output_index, min_output_amount)

  def swap_exact_output(self, input_index, output_amounts, max_input_amount=0):
    return self.__swap(False, output_amounts, input_index, max_input_amount)

  def add(self, input_amounts, min_mint_amount=0):
    if self.lp_supply == 0:
      input_amounts = SwimPool.__to_decimal(input_amounts)
      if any([amount == 0 for amount in input_amounts]):
        raise Exception("on first add all amounts must be greater than 0")
      depth = self.__calc_depth(input_amounts)
      if depth < min_mint_amount:
        raise Exception(
          f"insufficent lp tokens minted: at least {min_mint_amount} requested but "
          f"only {depth} would be minted"
        )
      self.balances = input_amounts
      self.lp_supply = depth
      return self.lp_supply, Decimal(0)
    else:
      return self.__add_remove(True, input_amounts, min_mint_amount)

  def remove_exact_output(self, output_amounts, max_burn_amount=0):
    return self.__add_remove(False, output_amounts, max_burn_amount)

  def remove_exact_burn(self, burn_amount, output_index, min_output_amount=0):
    burn_amount = Decimal(burn_amount)
    min_output_amount = Decimal(min_output_amount)
    initial_depth = self.depth()
    updated_depth = initial_depth * (1 - (burn_amount / self.lp_supply))
    # print("-      updated_depth:", updated_depth)
    known_balances = [
      balance for i, balance in enumerate(self.balances) if i != output_index
    ]
    feeless_amount = self.balances[output_index] - self.__calc_missing_balance(
      known_balances, updated_depth, self.balances[output_index]
    )
    # print("-     feeless_amount:", feeless_amount)
    if self.__total_fee > 0:
      taxable_percentage = 1 - self.balances[output_index] / sum(self.balances)
      # print("- taxable_percentage:", taxable_percentage)
      fee = (1 / (1 - self.__total_fee)) - 1
      original_amount = feeless_amount / (1 + taxable_percentage * fee)
      # print("-    original_amount:", original_amount)
      taxbase = original_amount * taxable_percentage
      # print("-            taxbase:", taxbase)
      fee_amount = fee * taxbase
      # print("-         fee_amount:", fee_amount)
      output_amount = feeless_amount - fee_amount
      updated_balances = [
        self.balances[i]
        if i != output_index
        else self.balances[i] - output_amount
        for i in range(self.token_count)
      ]
      total_fee_depth = self.__calc_depth(updated_balances, updated_depth) - updated_depth
      # print("-    total_fee_depth:", total_fee_depth)
      governance_depth = total_fee_depth * (
        self.governance_fee / self.__total_fee
      )
      # print("-   governance_depth:", governance_depth)
      # adjust for lp token appreciation
      updated_lp_supply = self.lp_supply - burn_amount
      lp_depth = updated_depth + total_fee_depth - governance_depth
      appreciation_factor = updated_lp_supply / lp_depth
      governance_mint_amount = governance_depth * appreciation_factor
    else:
      output_amount = feeless_amount
      governance_mint_amount = Decimal(0)

    if output_amount < min_output_amount:
      raise Exception(
        f"insufficent output: at least {min_output_amount} requested but "
        f"only {output_amount} received"
      )

    self.balances[output_index] -= output_amount
    self.lp_supply += governance_mint_amount - burn_amount
    return output_amount, governance_mint_amount

  def __swap(self, is_exact_input, amounts, index, limit):
    assert amounts[index] == 0
    initial_depth = self.depth()
    # print("-      initial_depth:", initial_depth)
    updated_balances = (SwimPool.__add if is_exact_input else SwimPool.__sub)(
      self.balances, amounts
    )
    # print("-   updated_balances:", updated_balances)

    if is_exact_input and self.__total_fee > 0:
      input_fee_amounts = [amount * self.__total_fee for amount in amounts]
      # print("-  input_fee_amounts:", input_fee_amounts)
      swap_base_balances = SwimPool.__sub(updated_balances, input_fee_amounts)
    else:
      swap_base_balances = updated_balances

    known_balances = [
      swap_base_balance
      for i, swap_base_balance in enumerate(swap_base_balances)
      if i != index
    ]
    missing_balance = self.__calc_missing_balance(
      known_balances,
      initial_depth,
      self.balances[index] if is_exact_input else None,
    )
    user_amount = self.__sub_given_order(
      is_exact_input, self.balances[index], missing_balance
    )

    if not is_exact_input and self.__total_fee > 0:
      final_amount = user_amount / (1 - self.__total_fee)
    else:
      final_amount = user_amount
    # print("-       final_amount:", final_amount)

    if limit > 0:
      if is_exact_input:
        if final_amount < limit:
          raise Exception(
            f"insufficent output: at least {limit} requested but only {final_amount} received"
          )
      else:
        if final_amount > limit:
          raise Exception(
            f"maximum input amount exceeded: {final_amount} required but "
            f"only {limit} authorized to be swapped"
          )

    self.balances = updated_balances
    self.balances[index] += (-1 if is_exact_input else 1) * final_amount
    if self.__total_fee > 0:
      final_depth = self.depth()
      # print("-        final_depth:", final_depth)
      total_fee_depth = final_depth - initial_depth
      # print("-    total_fee_depth:", total_fee_depth)
      governance_depth = total_fee_depth * (
          self.governance_fee / self.__total_fee
      )
      # print("-   governance_depth:", governance_depth)
      # adjust for lp token appreciation
      lp_depth = final_depth - governance_depth
      appreciation_factor = self.lp_supply / lp_depth
      governance_mint_amount = governance_depth * appreciation_factor
    else:
      governance_mint_amount = 0

    self.lp_supply += governance_mint_amount
    return final_amount, governance_mint_amount

  def __add_remove(self, is_add, amounts, limit):
    amounts = SwimPool.__to_decimal(amounts)
    initial_depth = self.depth()
    updated_balances = (SwimPool.__add if is_add else SwimPool.__sub)(
      self.balances, amounts
    )
    updated_depth = self.__calc_depth(
      updated_balances,
      initial_depth * (sum(updated_balances) / sum(self.balances)),
    )
    if self.__total_fee > 0:
      fee = self.__total_fee if is_add else (1 / (1 - self.__total_fee)) - 1
      # print("-                fee:", fee)
      scale_factor = sum(updated_balances) / sum(self.balances)
      # scale_factor = updated_depth/initial_depth
      # print("-       scale_factor:", scale_factor)
      scaled_balances = [scale_factor * balance for balance in self.balances]
      # print("-    scaled_balances:", scaled_balances)
      taxbase = [
        max(self.__sub_given_order(is_add, updated_balances[i], scaled_balances[i]), 0)
        for i in range(self.token_count)
      ]
      # print("-            taxbase:", taxbase)
      fee_amounts = [fee * taxbase[i] for i in range(self.token_count)]
      # print("-        fee_amounts:", fee_amounts)
      fee_adjusted_balances = SwimPool.__sub(updated_balances, fee_amounts)
      if not is_add and any([balance <= 0 for balance in fee_adjusted_balances]):
        raise Exception("impossible remove due to fees")
      # print("-   fee adj balances:", fee_adjusted_balances)
      fee_adjusted_depth = self.__calc_depth(fee_adjusted_balances, updated_depth)
      # print("- fee_adjusted_depth:", fee_adjusted_depth)
      total_fee_depth = abs(updated_depth - fee_adjusted_depth)
      # print("-    total_fee_depth:", total_fee_depth)
      user_depth = abs(initial_depth - fee_adjusted_depth)
      # print("-         user_depth:", user_depth)
      governance_depth = total_fee_depth * (self.governance_fee / self.__total_fee)
      lp_amount = user_depth / initial_depth * self.lp_supply
      if limit > 0:
        if is_add:
          if lp_amount < limit:
            raise Exception(
              f"insufficent lp tokens minted: at least {limit} requested but "
              f"only {lp_amount} would be minted"
            )
        else:
          if lp_amount > limit:
            raise Exception(
              f"maximum burn amount exceeded: {lp_amount} required but "
              f"only {limit} permitted to be burned"
            )
      # adjust for lp token appreciation
      updated_lp_supply = self.lp_supply + (1 if is_add else -1) * lp_amount
      lp_depth = (fee_adjusted_depth if is_add else updated_depth) - governance_depth
      appreciation_factor = updated_lp_supply / lp_depth
      governance_mint_amount = governance_depth * appreciation_factor
    else:
      lp_amount = abs(updated_depth - initial_depth) / initial_depth * self.lp_supply
      governance_mint_amount = Decimal(0)
    self.balances = updated_balances
    self.lp_supply += (lp_amount if is_add else -lp_amount) + governance_mint_amount
    return lp_amount, governance_mint_amount

  def __calc_depth(self, balances, initial_guess=None):
    # print("######################### CALC DEPTH #########################")
    assert self.token_count == len(balances)

    # print(f"__calc_depth({balances}):")

    A = self.amp_factor
    SA = Decimal(sum(balances) * A)

    # def geometric_mean(balances):
    #     gm = 1
    #     for balance in balances:
    #         gm *= Decimal.exp(Decimal.ln(balance)/self.token_count)
    #     return gm
    # depth_approx = n*geometric_mean(balances)
    depth_approx = Decimal(sum(balances)) if not initial_guess else initial_guess
    for i in range(self.max_iterations):
      reciprocal_decay = Decimal(1)
      for balance in balances:
        # # print(f"* Breciprocal_decay: {toBitsValueString(reciprocal_decay)}")
        reciprocal_decay *= depth_approx / Decimal(self.token_count * balance)

      numerator = Decimal(SA + self.token_count * depth_approx * reciprocal_decay)
      denominator = Decimal(A - 1) + Decimal(self.token_count + 1) * reciprocal_decay
      depth_next = numerator / denominator
      # print(f"*  reciprocal_decay: {toBitsValueString(reciprocal_decay)}")
      # print(f"*         numerator: {toBitsValueString(numerator)}")
      # print(f"*       denominator: {toBitsValueString(denominator)}")
      # print(f"*             depth: {toBitsValueString(depth_next)}")
      if abs(depth_next - depth_approx) <= self.tolerance:
        # print("n calc_depth converged after:", i + 1)
        return depth_next
      depth_approx = depth_next
    assert False

  def __calc_missing_balance(self, known_balances, depth, initial_guess=None):
    # print("#################### CALC MISSING BALANCE #####################")
    assert len(known_balances) == self.token_count - 1
    DA = depth / self.amp_factor

    reciprocal_decay = Decimal(1)
    for balance in known_balances:
      # print(f"* Breciprocal_decay: {toBitsValueString(reciprocal_decay)}")
      reciprocal_decay *= depth / (self.token_count * balance)

    numerator_fixed = DA * depth / self.token_count * reciprocal_decay
    denominator_fixed = sum(known_balances) + DA

    # print(f"*  reciprocal_decay: {toBitsValueString(reciprocal_decay)}")
    # print(f"*   numerator_fixed: {toBitsValueString(numerator_fixed)}")
    # print(f"* denominator_fixed: {toBitsValueString(denominator_fixed)}")

    missing_balance_approx = depth if not initial_guess else initial_guess
    for i in range(self.max_iterations):
      numerator = missing_balance_approx ** 2 + numerator_fixed
      denominator = 2 * missing_balance_approx + denominator_fixed - depth
      missing_balance_next = numerator / denominator
      # print(f"*         numerator: {toBitsValueString(numerator)}")
      # print(f"*       denominator: {toBitsValueString(denominator)}")
      # print(f"*   missing_balance: {toBitsValueString(missing_balance_next)}")
      if abs(missing_balance_next - missing_balance_approx) <= self.tolerance:
        # print("n missing_balance converged after:", i + 1)
        return missing_balance_next
      missing_balance_approx = missing_balance_next
    assert False

  def ext_calc_depth(self, balances, initial_guess=None):
    return self.__calc_depth(balances, initial_guess)

  def ext_calc_missing_balance(self, known_balances, depth, initial_guess=None):
    return self.__calc_missing_balance(known_balances, depth, initial_guess)

  @staticmethod
  def __sub_given_order(keep_order, v1, v2):
    return v1 - v2 if keep_order else v2 - v1

  @staticmethod
  def __add(v1, v2):
    assert len(v1) == len(v2)
    return [v1[i] + v2[i] for i in range(len(v1))]

  @staticmethod
  def __sub(v1, v2):
    assert len(v1) == len(v2)
    return [v1[i] - v2[i] for i in range(len(v1))]

  @staticmethod
  def __to_decimal(v):
    return [Decimal(x) for x in v]
