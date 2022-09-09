# Swim.io Pool Programs written in anchor

## Development

If any changes are made to the smart contract that would require regenerating the idl
run the following command from the `swim-anchor` directory and update any relevant sdk related code
`yarn run idl`

## Scripts (WIP)

```sh
# for localnet testing
yarn run prep && anchor localnet --skip-build

anchor run initialize_pool

# for devnet
yarn run prep:devnet && anchor run --provider.cluster initilaize_pool
```

## Tests

1. to run the tests in sdk/tests run any of the following from `package/swim-anchor`

```sh
yarn run test:propeller
yarn run test:pool
yarn run test
```

### Troubleshooting

1. if running into an error like this

```
FetchError: request to http://localhost:8899/ failed, reason: connect ECONNREFUSED 127.0.0.1:8899
```

check your npm version. npm lts/gallium (v16.15.1 as of this writing) works but v18.4.0 hits this issue

## Deployment

`anchor deploy --provider.cluster devnet --program-name two-pool --program-keypair ~/work/swim/keypairs/devnet/pool_restructure/two_pool_anchor.json`

## To Dos

1. update `yarn idl` cmd once propeller is added to monorepo so that idl artifacts are generated
into the correct directory for each program
2. adjust visibility of imports/crates to only expose what's needed
3. enhance lp metadata tests with mpl js storage mock logic
4. anchor can't handle nested custom structs for inputs into ixs.
    1. look into using just u32 for lp_fee, gov_fee for ix inputs represented as pips
5. Might have to think about seeds used to initialize pool PDA.
    1. not sure if susceptible to [pda sharing exploit](https://github.com/coral-xyz/anchor/pull/2041/files#diff-f48ff5c23fd7492bb7255324f1160735f7b0771fde6e1782a198c81d44363c34)
        1. don't think so since as part of the process to initialize the pool pda, you need to initialize the lp_mint
        so we should be safe from anyone being able to initialize another pda ("share" it)
    2. to be safe, could alternatively create pool token accounts prior to the initialize ix,
        then use those as seeds for the pool state pda. that would be closer to secure solution from exploit docs
6. maybe add a version field to `TwoPool` state (and seeds to derive pda)
    1. look into if versioning still worth it since accounts can now be re-allocated.
7. rust documentation & [documentation testing](https://doc.rust-lang.org/rust-by-example/testing/doc_testing.html)
8. re-implement two pool fuzzing
