module account::test_coin {
    use std::signer;
    use std::string::utf8;

    use aptos_framework::coin;

    struct USDC {}

    public entry fun initialize(account: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<USDC>(
            account,
            utf8(b"USDC (Swim.io testnet)"),
            utf8(b"USDC"),
            6,
            true,
        );

        let coins = coin::mint(1000000000000, &mint_cap);
        coin::register<USDC>(account);
        coin::deposit(signer::address_of(account), coins);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_freeze_cap(freeze_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}
