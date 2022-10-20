# Attestation script for attesting a solana tolen to Aptos

See [wormhole token registration page](https://book.wormhole.com/technical/typescript/attestingToken.html) for more info on attestation.

## Usage

```bash
 WALLET_SOLANA_MNEMONIC_PHRASE='...' APTOS_ACCOUNT_PRIVATE_KEY=... yarn attestFromSolanaToAptos --mintAddress '3ngTtoyP9GFybFifX1dr7gCFXFiM2Wr6NfXn6EuU7k6C'
```

Note: APTOS_ACCOUNT_PRIVATE_KEY should not have the `0x` prefix.
