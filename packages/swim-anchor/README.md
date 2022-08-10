# Swim.io Pool Programs written in anchor

## Development

If any changes are made to the smart contract that would require regenerating the idl
run the following command from the `swim-anchor` directory and update any relevant sdk related code
`yarn run idl`

## Scripts (WIP)
1. To run the initialize_pool script run
  `anchor run initialize_pool`
    1. this runs the alias under the `[scripts]` section in the `Anchor.toml`
    2. to test on localnet, start anchor test validator first with `anchor localnet`.

### Troubleshooting
1. if running into an error like this
```
FetchError: request to http://localhost:8899/ failed, reason: connect ECONNREFUSED 127.0.0.1:8899
```
check your npm version. npm lts/gallium (v16.15.1 as of this writing) works but v18.4.0 hits this issue


## To Dos
1. update `yarn idl` cmd once propeller is added to monorepo so that idl artifacts are generated
   into the correct directory for each program
2. adjust visibility of imports/crates to only expose what's needed
3. enhance lp metadata tests with mpl js storage mock logic
4. anchor can't handle nested custom structs for inputs into ixs.
    1. look into using just u32 for lp_fee, gov_fee for ix inputs represented as pips
5. Might have to think about seeds used to initialize pool PDA.
    1. not sure if susceptible to [pda sharing exploit](https://github.com/coral-xyz/anchor/pull/2041/files#diff-f48ff5c23fd7492bb7255324f1160735f7b0771fde6e1782a198c81d44363c34)
    2. don't think so since as part of the process to initialize the pool pda, you need to initialize the lp_mint so
        we should be safe from anyone being able to initialize another pda ("share" it)
    3. to be safe, could alternatively create pool token accounts outside of the initialize ix,
        then use those as seeds for the pool state pda. that would be closer to secure solution from exploit docs

