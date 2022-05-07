# Development Setup

## Setting up a server

### From a snapshot

1. Set up a Digital Ocean droplet from the most recent snapshot. Give it all the SSH keys required.
1. Update your local SSH config for `wormhole-v2` with the new IP address.
1. On your local machine: `ssh wormhole-v2`.
1. Start a `tmux` session: `tmux` (optional).
1. In one pane start minikube and the dashboard: `minikube start && minikube dashboard --url --port 41841`.
1. In another pane set up the reverse proxy (using the config from [PROXY_SERVER.md](PROXY_SERVER.md), which should be set up): `ssh proxy`.
1. In another pane run `cd wormhole && tilt up`.

### From a fresh Docker DO droplet

1. Set up a Digital Ocean droplet from the Docker marketplace image (preferably Intel, at least 8 vCPU, 16 GB RAM). Give it all the SSH keys required.
1. `ssh root@NEW_IP`
1. Create `wormhole` user: `adduser wormhole`
1. Add them to sudoers: `usermod -aG sudo wormhole`
1. Create docker group and add them: `usermod -aG docker wormhole && newgrp docker`
1. Copy SSH authorized keys from `root` and make permissions correct: https://superuser.com/a/215506
1. Switch to `wormhole` user: `su - wormhole` (or exit and reconnect via `ssh wormhole@NEW_IP`)
1. Install minikube: https://minikube.sigs.k8s.io/docs/start/
1. Install Tilt: https://docs.tilt.dev/install.html (don't bother about all the other stuff they tell you to install)
1. Configure and start minikube (see `MINIKUBE.md`)
1. Clone `swim-io`'s wormhole fork (https://github.com/swim-io/wormhole.git)
1. Checkout branch `wormat-v2` (or whatever is required)
1. `tilt up` in the repo

## Deploying a Solana program

Normally when you send a transaction to a Solana blockchain you interact with the RPC. This applies to the Web3 tools as well as the `solana` CLI tool. However, when deploying a program, the CLI talks directly to the transaction processing unit (TPU), because deployment entails a large number of transactions, and it is much faster to use UDP and the TPU than to send everything via the RPC using TCP.

The Wormhole dev setup does not expose the TPU port, which means if we want to deploy a program we either have to:

1. Deploy the program as part of the initial blockchain setup
1. Deploy the program from within the container running the Solana blockchain

### Deploying a program as part of the initial blockchain setup

This process should be improved, but for now we do the following:

1. Add the compiled program to VCS in https://github.com/swim-io/wormhole/tree/wormat-v2/solana/modules
1. Update `solana/Dockerfile`
1. Update `devnet/solana-devnet.yaml`
1. Pull the changes on the server
1. Start the blockchain

### Deploying a program to a running blockchain

SSH into the server, then set the `kubectl` context:

```sh
minikube kubectl -- config set-context --current --namespace=wormhole
```

Make sure your config is set up in `~/.config/solana/cli/config.yml` in the container:

```sh
minikube kubectl -- exec -it solana-devnet-0 -c devnet -- bash -c 'mkdir -p ~/.config/solana/cli && cat <<EOF > ~/.config/solana/cli/config.yml
json_rpc_url: "http://127.0.0.1:8899"
websocket_url: ""
keypair_path: /usr/src/solana/keys/solana-devnet.json
EOF'
```

Then deploy with the following:

```sh
minikube kubectl -- exec -it solana-devnet-0 -c devnet -- bash -c 'curl -L --silent <URL_OF_FILE> > "/tmp/<FILENAME>" && solana program deploy "/tmp/<FILENAME>" -k test-ledger/validator-keypair.json'
```

## Setting up tokens and pools

These steps apply after starting for the first time, or restarting the blockchains:

1. Potentially restart services via Tilt on http://localhost:10350/ (when ssh'ed): `solana-devnet`, `eth-devnet`, `eth-devnet2`, `terra-terrad`, `terra-fcd`. Afterwards restart `guardian`

   - Some services are pending even after the second green status light in Tilt

1. Reset MetaMask (Localnet Ethereum & Localnet BSC)
1. Solana setup script

   - `./scripts/setup_solana_dev.sh`

1. Test page -> Set up Wormhole tokens for Ethereum
1. Test page -> Set up Wormhole tokens for BSC
1. Test page -> Get wrapped SPL token addresses on Ethereum (for each supported SPL token)
1. Test page -> Get wrapped SPL token addresses on BSC (for each supported SPL token)
1. Update `localnet-solana-usdc` and `localnet-solana-usdt` addresses in config
1. Test page -> Init pool with random keys to check all the txs work
1. Test page -> Init pool with deterministic keys (for each pool)
1. Test page -> Attest LP token (for each pool)
1. Test page -> Get wrapped LP token addresses on Ethereum (for each pool)
1. Test page -> Get wrapped LP token addresses on BSC (for each pool)
1. Update `localnet-solana-lp-hexapool` addresses in config
1. Add tokens to MetaMask (optional)
1. Test page -> Massive preapproval
1. Pool page -> Deposit equal amounts of each

## Airdrops

If your SOL balance gets low you can airdrop yourself some tokens:

- `./scripts/airdrop.sh`

## Updating the pool contract

1. Run `cargo build-bpf` in the [pool repo](https://github.com/swim-io/pool) locally
1. Copy the `target/deploy/pool.so` file into the Wormhole repo on the development server (eg via [swim-io/wormhole#wormat-v2](https://github.com/swim-io/wormhole/tree/wormat-v2)) under `solana/modules/pool.so`
1. Trigger a reload of the `solana-devnet` resource via the Tilt interface (port 10350)
1. Setup the Wormhole tokens and update the config (see next section)
