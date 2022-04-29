import * as Sentry from "@sentry/react";
import type { Signer } from "ethers";
import { ethers } from "ethers";
import EventEmitter from "eventemitter3";

import type { EvmChainId, EvmEcosystemId, TokenSpec } from "../../../../config";
import {
  Protocol,
  allUniqueChains,
  ecosystems,
  evmChainIdToEcosystem,
} from "../../../../config";
import { sleep } from "../../../../utils";

type Web3Provider = ethers.providers.Web3Provider;

const { hexValue } = ethers.utils;

// Errors sourced from MetaMask:
// https://github.com/MetaMask/eth-rpc-errors/blob/main/src/error-constants.ts
const METAMASK_unrecognizedChainId = 4902;
const METAMASK_methodNotFound = -32601;

// TODO: Make this class wallet-agnostic, currently assumes MetaMask.
export interface EvmWalletAdapter extends EventEmitter {
  readonly chainId: EvmChainId;
  readonly signer: Signer | null;
  readonly address: string | null;
  readonly connect: () => Promise<unknown>;
  readonly disconnect: () => Promise<void>;
  readonly switchNetwork: () => Promise<unknown>;
  readonly registerToken: (tokenSpec: TokenSpec) => Promise<unknown>;
}

export class EvmWeb3WalletAdapter
  extends EventEmitter
  implements EvmWalletAdapter
{
  readonly chainId: EvmChainId;
  readonly serviceName: string;
  readonly serviceUrl: string;
  address: string | null;
  private readonly getWalletProvider: () => Web3Provider | null;
  private connecting: boolean;

  constructor(
    chainId: EvmChainId,
    serviceName: string,
    serviceUrl: string,
    getWalletProvider: () => Web3Provider | null,
  ) {
    super();
    this.chainId = chainId;
    this.serviceName = serviceName;
    this.serviceUrl = serviceUrl;
    this.getWalletProvider = getWalletProvider;
    this.address = null;
    this.connecting = false;
  }

  private get ecosystem(): EvmEcosystemId {
    return evmChainIdToEcosystem[this.chainId];
  }

  private get sentryContextKey(): string {
    return `${ecosystems[this.ecosystem].displayName} Wallet`;
  }

  private get walletProvider(): Web3Provider | null {
    return this.getWalletProvider();
  }

  public get signer(): Signer | null {
    return this.getWalletProvider()?.getSigner() ?? null;
  }

  async connect(): Promise<void> {
    if (this.connecting) {
      return;
    }
    if (!this.walletProvider) {
      this.emit(
        "error",
        `${this.serviceName} error`,
        `Please install ${this.serviceName}:\n${this.serviceUrl}`,
      );
      return;
    }

    this.connecting = true;
    try {
      const [address] = await this.walletProvider.send(
        "eth_requestAccounts",
        [],
      );
      this.address = address;
      this.emit("connect", this.address);

      Sentry.setContext(this.sentryContextKey, {
        walletName: this.serviceName,
        address: this.address,
      });
      Sentry.addBreadcrumb({
        category: "wallet",
        message: `Connected to ${this.sentryContextKey} ${this.address}`,
        level: Sentry.Severity.Info,
      });
    } catch (error) {
      await this.disconnect();
      // TODO: parse actual errors from this
      // Sentry.captureException(error);
      console.error(error);
    }
    this.connecting = false;
  }

  async disconnect(): Promise<void> {
    if (this.address) {
      this.address = null;
      this.emit("disconnect");

      Sentry.setContext(this.sentryContextKey, {});
      Sentry.addBreadcrumb({
        category: "wallet",
        message: `Disconnected from ${this.sentryContextKey}`,
        level: Sentry.Severity.Info,
      });
    }
  }

  async switchNetwork(): Promise<void> {
    if (!this.walletProvider) {
      throw new Error("No wallet provider");
    }

    try {
      await this.walletProvider.send("wallet_switchEthereumChain", [
        { chainId: hexValue(this.chainId) },
      ]);
    } catch (switchError: any) {
      if (switchError.code === METAMASK_unrecognizedChainId) {
        const evmSpec = allUniqueChains[Protocol.Evm].find(
          (spec) => spec.chainId === this.chainId,
        );
        if (!evmSpec) {
          throw new Error("No EVM spec found for chain ID");
        }
        // this also asks to switch to that chain afterwards
        await this.walletProvider.send("wallet_addEthereumChain", [
          {
            chainId: hexValue(this.chainId),
            chainName: evmSpec.chainName,
            nativeCurrency: evmSpec.nativeCurrency,
            rpcUrls: evmSpec.rpcUrls,
          },
        ]);
      } else if (switchError.code === METAMASK_methodNotFound) {
        this.emit(
          "error",
          `${this.serviceName} error`,
          `Please update your ${this.serviceName}.`,
        );
      } else {
        throw switchError;
      }
    }
  }

  async registerToken(tokenSpec: TokenSpec): Promise<boolean> {
    if (!this.walletProvider) {
      throw new Error("No wallet provider");
    }
    const details = tokenSpec.detailsByEcosystem.get(this.ecosystem);
    if (!details) {
      throw new Error(
        `No ${ecosystems[this.ecosystem].displayName} details for token`,
      );
    }
    await this.switchNetwork();

    await sleep(200); // Sleep briefly, otherwise Metamask ignores the second prompt

    const wasAdded: boolean = await this.walletProvider.send(
      "wallet_watchAsset",
      {
        type: "ERC20", // Initially only supports ERC20, but eventually more!
        options: {
          address: details.address, // The address that the token is at.
          symbol: tokenSpec.symbol, // A ticker symbol or shorthand, up to 5 chars.
          decimals: details.decimals, // The number of decimals in the token
          // TODO: image: tokenSpec.icon, // A string url of the token logo
        },
      } as any,
    );
    return wasAdded;
  }
}
