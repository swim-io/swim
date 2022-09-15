module account::pool {
    use liquidswap::router;
    use account::coins::USDT;
    use account::coins::SwimUSD;
    use account::lp::LP as SwimLP;
    use aptos_framework::coin;
    use std::signer;

    public entry fun create_pool(account: &signer) {
        // TODO use the pool register function (not the router's)
        // which allows us to set a custom name
        router::register_pool<USDT, SwimUSD, SwimLP<USDT, SwimUSD>>(
            account,
            2 // Uncorrelated curve formula (x*y=k).
            // TODO decide if we want to use this ^ (which existing pools use?) or their stablecoin formula x^3*y + x*y^3 = k
        );
    }

    // this requires the account to be the owner of the pool
    public entry fun add_liquidity(account: &signer) {
        let account_addr = signer::address_of(account);

        let min_swim_usd_liq = 1000;
        let min_usdt_liq = 1000;

        let swim_usd_liq = coin::withdraw<SwimUSD>(account, min_swim_usd_liq);
        let usdt_liq = coin::withdraw<USDT>(account, min_usdt_liq);

        let (usdt_remainder, swim_usd_remainder, lp) = router::add_liquidity<USDT, SwimUSD, SwimLP<USDT, SwimUSD>>(
            account_addr,
            usdt_liq,
            min_usdt_liq,
            swim_usd_liq,
            min_swim_usd_liq,
        );

        coin::deposit(account_addr, usdt_remainder);
        coin::deposit(account_addr, swim_usd_remainder);

        if (!coin::is_account_registered<SwimLP<USDT, SwimUSD>>(account_addr)) {
            coin::register<SwimLP<USDT, SwimUSD>>(account);
        };

        coin::deposit(account_addr, lp);
    }

    // this is not usable due to min liquidity amount in the liquidswap pool
    // kept it due to the 'upgrade_policy' that requires backwards compatible contracts TODO learn more about upgrade_policy
    public entry fun add_liquidity_from_liquidity_account(account: &signer, pool_address: address) {
        let account_addr = signer::address_of(account);

        let min_swim_usd_liq = 1000;
        let min_usdt_liq = 1000;

        let swim_usd_liq = coin::withdraw<SwimUSD>(account, min_swim_usd_liq);
        let usdt_liq = coin::withdraw<USDT>(account, min_usdt_liq);

        let (usdt_remainder, swim_usd_remainder, lp) = router::add_liquidity<USDT, SwimUSD, SwimLP<USDT, SwimUSD>>(
            pool_address,
            usdt_liq,
            min_usdt_liq,
            swim_usd_liq,
            min_swim_usd_liq,
        );

        coin::deposit(account_addr, usdt_remainder);
        coin::deposit(account_addr, swim_usd_remainder);

        if (!coin::is_account_registered<SwimLP<USDT, SwimUSD>>(account_addr)) {
            coin::register<SwimLP<USDT, SwimUSD>>(account);
        };

        coin::deposit(account_addr, lp);
    }

    // had to create this cause their pool has a minimum liquidity amount of 1000 coinds
    // see  https://github.com/pontem-network/liquidswap/blob/ccf0540093a5e35284c992d06e7e9322404fd72b/sources/swap/liquidity_pool.move#L64
    public entry fun add_liquidity_from_liquidity_account2(account: &signer, pool_address: address, min_swim_usd_liq: u64, min_usdt_liq: u64) {
        let account_addr = signer::address_of(account);

        let swim_usd_liq = coin::withdraw<SwimUSD>(account, min_swim_usd_liq);
        let usdt_liq = coin::withdraw<USDT>(account, min_usdt_liq);

        let (usdt_remainder, swim_usd_remainder, lp) = router::add_liquidity<USDT, SwimUSD, SwimLP<USDT, SwimUSD>>(
            pool_address,
            usdt_liq,
            min_usdt_liq,
            swim_usd_liq,
            min_swim_usd_liq,
        );

        coin::deposit(account_addr, usdt_remainder);
        coin::deposit(account_addr, swim_usd_remainder);

        if (!coin::is_account_registered<SwimLP<USDT, SwimUSD>>(account_addr)) {
            coin::register<SwimLP<USDT, SwimUSD>>(account);
        };

        coin::deposit(account_addr, lp);
    }

    public entry fun swap_exact_coin_for_coin<X, Y, LP>(account: &signer, pool_address: address, coin_in: u64, coin_out_min_val: u64) {
      let account_addr = signer::address_of(account);
      let x_coin_liq = coin::withdraw<X>(account, coin_in);

      let (coin_out) = router::swap_exact_coin_for_coin<X, Y, LP>(pool_address, x_coin_liq, coin_out_min_val);

      coin::deposit(account_addr, coin_out);
    }
}
