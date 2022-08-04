@sdk
@ui
Feature: Swap

  As a crypto enthusiast
  Patrick Swapze wants to swap between different tokens which live on various blockchains
  So that he can trade on whichever platform with whichever tokens are most profitable at any time


  Background:

    Given there is a Solana blockchain
    And Patrick has a Solana wallet with address "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"
    And Patrick has 5 SOL in his Solana wallet
    And Patrick has a USDC token account with address "TP19UrkLUihiEg3y98VjM8Gmh7GjWayucsbpyo195wC"
    And Patrick has a USDT token account with address "TP2gzosaKJNf5UjM8eWKKnN7Yni1uLbYJr88rvEvgPA"


  Example: Solana USDC -> Solana USDT

    Given there is a Solana-only pool with USDC and USDT tokens, an amp factor of 1000, an LP fee of 0.03%, and a governance fee of 0.01%
    And 1000 USDC has been deposited into the pool
    And 1000 USDT has been deposited into the pool
    And Patrick has 100 USDC tokens in his Solana wallet
    And Patrick has 100 USDT tokens in his Solana wallet

    When Patrick swaps an exact input of 10 USDC for USDT with a slippage setting of 0.5%

    Then Patrick's USDC balance should be 90
    And Patrick's USDT balance should be at least 109.945


  Example: Solana USDC -> Ethereum USDC

    Given somebody has written the example
