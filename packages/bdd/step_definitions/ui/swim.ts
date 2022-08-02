import { Given, When } from "@cucumber/cucumber";

class PageObject {
  public visit(): Promise<void> {
    throw new Error("not implemented");
  }
}

class SwapPage extends PageObject {
  public setFromToken(token: string): Promise<void> {
    // TODO: Select token from dropdown list
    throw new Error("not implemented");
  }

  public setToToken(token: string): Promise<void> {
    // TODO: Select token from dropdown list
    throw new Error("not implemented");
  }

  public setSlippage(slippage: number): Promise<void> {
    // TODO: Click on settings button and type in number in slippage field
    throw new Error("not implemented");
  }

  public setInputAmount(inputAmount: number): Promise<void> {
    // TODO: Type in number in input amount field
    throw new Error("not implemented");
  }

  public submitForm(): Promise<void> {
    // TODO: Click swap button
    throw new Error("not implemented");
  }
}

Given(
  "there is a Solana-only pool with {word} and {word} tokens, an amp factor of {float}, an LP fee of {float}%, and a governance fee of {float}%",
  function (
    token1: string,
    token2: string,
    ampFactor: number,
    lpFee: number,
    governanceFee: number,
  ) {
    // TODO: Set up pool
    this.poolTokens = [token1, token2];
  },
);

Given(
  "{float} {word} has been deposited into the pool",
  function (amount: number, token: string) {
    // TODO: Deposit to pool
  },
);

When(
  "{word} swaps an exact input of {float} {word} for {word} with a slippage setting of {float}%",
  async function (
    user: string,
    amount: number,
    fromToken: string,
    toToken: string,
    slippage: number,
  ) {
    const swapPage = new SwapPage();
    await swapPage.visit();
    await swapPage.setFromToken(fromToken);
    await swapPage.setToToken(toToken);
    await swapPage.setSlippage(slippage);
    await swapPage.setInputAmount(amount);
    await swapPage.submitForm();
  },
);
