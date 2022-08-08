# Swim.io Pool Programs written in anchor

## Development

TODO: update yarn idl cmd once propeller is added to monorepo so that idl artifacts are generated
into the correct directory for each program

If any changes are made to the smart contract that would require regenerating the idl
run the following command from the `swim-anchor` directory and update any relevant sdk related code
`yarn run idl`

## Scripts (WIP)
1. To run the initialize_pool script run
  `anchor run initialize_pool`
    1. this runs the alias under the `[scripts]` section in the `Anchor.toml`

### Troubleshooting
1. if running into an error like this
```
FetchError: request to http://localhost:8899/ failed, reason: connect ECONNREFUSED 127.0.0.1:8899
```
check your npm version. npm lts/gallium (v16.15.1 as of this writing) works but v18.4.0 hits this issue
