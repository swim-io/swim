module account::coins {
    use std::signer;
    use std::string::utf8;

    use aptos_framework::coin::{Self, MintCapability, BurnCapability};

    /// Represents test USDT coin.
    struct USDT {}

    /// Represents test BTC coin.
    struct SwimUSD {}

    /// Storing mint/burn capabilities for `USDT` and `SwimUSD` coins under user account.
    struct Caps<phantom CoinType> has key {
        mint: MintCapability<CoinType>,
        burn: BurnCapability<CoinType>,
    }

    /// Initializes `swimUSD` and `USDT` coins.
    public entry fun register_coins(token_admin: &signer) {
        let (swimUSD_b, swimUSD_f, swimUSD_m) =
            coin::initialize<SwimUSD>(token_admin,
                utf8(b"swimUSD"), utf8(b"swimUSD"), 8, true);
        let (usdt_b, usdt_f, usdt_m) =
            coin::initialize<USDT>(token_admin,
                utf8(b"Tether"), utf8(b"USDT"), 6, true);

        coin::destroy_freeze_cap(swimUSD_f);
        coin::destroy_freeze_cap(usdt_f);

        move_to(token_admin, Caps<SwimUSD> { mint: swimUSD_m, burn: swimUSD_b });
        move_to(token_admin, Caps<USDT> { mint: usdt_m, burn: usdt_b });
    }

    /// Mints new coin `CoinType` on account `acc_addr`.
    public entry fun mint_coin<CoinType>(token_admin: &signer, acc_addr: address, amount: u64) acquires Caps {
        let token_admin_addr = signer::address_of(token_admin);
        let caps = borrow_global<Caps<CoinType>>(token_admin_addr);
        let coins = coin::mint<CoinType>(amount, &caps.mint);
        coin::deposit(acc_addr, coins);
    }

    public entry fun mint_usdt(token_admin: &signer, acc_addr: address, amount: u64) acquires Caps {
        mint_coin<USDT>(token_admin, acc_addr, amount);
    }
}
