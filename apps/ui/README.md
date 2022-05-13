# Swim Frontend

React Frontend to bridge assets and interact with Swim liquidity pools.

## Setup

### Basic Installation

You will need Node.js <15 and Yarn.

Run `yarn` to install all dependencies.

Set required environmental variables:

```sh
SKIP_PREFLIGHT_CHECK=true
REACT_APP_AVALANCHE_DEVNET_RPC_URL=<ask for latest value>
REACT_APP_POLYGON_DEVNET_RPC_URL=<ask for latest value>
```

Run `yarn start` to run the app in development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Editor/IDE

We support [EditorConfig](https://editorconfig.org/), which provides plugins for all major editors and IDEs. This will ensure consistency for basic coding styles such as indentation and line breaks. See [.editorconfig](.editorconfig) for details.

We use ESLint and Prettier for linting and formatting. It’s a good idea to set up formatting on save in your editor/IDE.

## Linting

In the project directory, you can run:

#### `yarn format`

Runs `prettier` on all `.{ts,tsx}` files in the `src` directory.

#### `yarn lint` and `yarn lint:fix`

Lints all `.{ts,tsx}` files in the `src` directory, with or without the `--fix` option.

## Localnet/Teamnet Setup

By default, you only have access to Mainnet. For development, you'll likely want to setup a development blockchain environment. There are several options for this, (A) is recommended.

To view more networks in the environment switcher in the upper right corner of the UI, visit [localhost:3000/set-custom-localnet?ip=1](http://localhost:3000/set-custom-localnet?ip=1) and refresh the page.

### (A) Connect to our shared Wormhole setup

There is a Digital Ocean machine running an instance of each blockchain in additon to a copy of the Wormhole Guardians.

1. Ask one of the frontend devs to add your SSH key to the development server
1. Add `src/keys/wallet-accounts/6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J.json` to your Solana web wallet (e.g. Phantom)
1. Add `src/keys/wallet-accounts/0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1.txt` to your Ethereum web wallet (e.g. MetaMask)
1. Add Ethereum Localnet to your Metamask

   RPC URL: http://159.223.16.33:8545

   Chain ID: 1337

   Currency Symbol: ETH

1. Add BNB Chain Localnet to your MetaMask

   RPC URL: http://159.223.16.33:8546

   Chain ID: 1397

   Currency Symbol: BNB

1. `yarn start` and visit http://localhost:3000/set-custom-localnet?ip=159.223.16.33 to set your custom localnet IP
1. On http://localhost:3000/swap, choose `CustomLocalnet` as your network
1. Connect your wallets, should see non-zero balances

#### Troubleshoot

If the environment stops working, follow the steps below

1. Add the config below to your `~/.ssh/config` file (with your own key file)

   ```ssh-config
   Host wormhole-v2-proxy
     Hostname 159.223.16.33
     User wormhole
     PreferredAuthentications publickey
     AddKeysToAgent yes
     IdentityFile ~/.ssh/your_ssh_key # 👈 Use your own key file here
     LogLevel quiet
     LocalForward 7070 127.0.0.1:7070
     LocalForward 7071 127.0.0.1:7071
     LocalForward 8545 127.0.0.1:8545
     LocalForward 8546 127.0.0.1:8546
     LocalForward 8899 127.0.0.1:8899
     LocalForward 8900 127.0.0.1:8900

   Host wormhole-v2
     Hostname 165.227.133.217
     User wormhole
     PreferredAuthentications publickey
     AddKeysToAgent yes
     IdentityFile ~/.ssh/your_ssh_key # 👈 Use your own key file here
     LogLevel quiet
     LocalForward 1317 127.0.0.1:1317
     LocalForward 2345 127.0.0.1:2345
     LocalForward 3060 127.0.0.1:3060
     LocalForward 4001 127.0.0.1:4001
     LocalForward 4002 127.0.0.1:4002
     LocalForward 6060 127.0.0.1:6060
     LocalForward 6061 127.0.0.1:6061
     LocalForward 7070 127.0.0.1:7070
     LocalForward 7071 127.0.0.1:7071
     LocalForward 7072 127.0.0.1:7072
     LocalForward 8080 127.0.0.1:8080
     LocalForward 8545 127.0.0.1:8545
     LocalForward 8546 127.0.0.1:8546
     LocalForward 8899 127.0.0.1:8899
     LocalForward 8900 127.0.0.1:8900
     LocalForward 9000 127.0.0.1:9000
     LocalForward 9901 127.0.0.1:9901
     LocalForward 10350 127.0.0.1:10350
     LocalForward 26657 127.0.0.1:26657
     LocalForward 41841 127.0.0.1:41841
   ```

1. Run `ssh wormhole-v2`

   This will give you a shell and all the relevant ports will be forwarded to the development server. If you don’t need a shell you can just run `ssh -N wormhole-v2`.

1. [Restarting the chains](http://localhost:10350/overview) and following the steps in [DEV_SETUP](/docs/DEV_SETUP.md#setting-up-tokens-and-pools).

Details about contract addresses can be found in the various files in `src/config`.

### (B) Basic local Solana-only pools setup

1. Add keys/6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J.json to your web wallet (eg sollet.io)
1. Start a local cluster: `solana-test-validator`
1. Run setup script `./scripts/setup_solana_dev.sh`
1. Build Swim contract locally
1. Deploy Swim contract: `./scripts/deploy_swim.sh`
1. Start UI `yarn start`
1. Visit http://localhost:3000/test
1. Init pool (UI)

### (C) Setup local Wormhole environment from scratch

1. Checkout branch `wormat-v2` of Wormat's Wormhole fork: https://github.com/swim-io/wormhole/tree/wormat-v2
1. Follow the instructions in `DEVELOP.md` for prerequisites etc
1. `tilt up` in the root directory of the Wormhole repo
1. Visit http://localhost:10350 for an overview
1. Once `solana-devnet` is ready, run `./scripts/setup_solana_dev.sh`
1. Start UI `yarn start`
1. Visit http://localhost:3000/test
1. Connect wallets and click "Set up Wormhole tokens" button
1. Start Wormhole Bridge UI: from Wormhole root `cd bridge_ui && npm install && npm start`
1. Assuming the Bridge UI is running on port 3001, visit http://localhost:3001
1. Connect wallets and find the Ethereum addresses for the 4 wrapped SPL tokens
1. Update the addresses in the localnet config in `src/constants/config.ts`
1. Wait for the UI to rebuild

## Disclaimer

Use at your own risk. Swim Protocol Foundation, and its representatives and agents disclaim all warranties, express or implied, related to the application you are accessing, and are not liable for any transactions you conduct thereon or losses that may result therefrom. US Persons are not permitted to access or use this application.
