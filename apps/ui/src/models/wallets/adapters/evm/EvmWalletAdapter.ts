import * as Sentry from "@sentry/react";
import type { SeverityLevel } from "@sentry/types";
import type { EvmProtocol } from "@swim-io/evm-types";
import { EVM_PROTOCOL } from "@swim-io/evm-types";
import type { Signer } from "ethers";
import { ethers } from "ethers";
import EventEmitter from "eventemitter3";

import type { EcosystemId, EvmChainId, TokenSpec } from "../../../../config";
import { ALL_UNIQUE_CHAINS, ECOSYSTEMS } from "../../../../config";
import { captureException } from "../../../../errors";
import { sleep } from "../../../../utils";

type Web3Provider = ethers.providers.Web3Provider;

const { hexValue } = ethers.utils;

// Errors sourced from MetaMask:
// https://github.com/MetaMask/eth-rpc-errors/blob/main/src/error-constants.ts
const METAMASK_unrecognizedChainId = 4902;
const METAMASK_methodNotFound = -32601;

// TODO: Make this class wallet-agnostic, currently assumes MetaMask.
export interface EvmWalletAdapter extends EventEmitter {
  readonly signer: Signer | null;
  readonly address: string | null;
  readonly connected: boolean;
  readonly connect: (args?: any) => Promise<unknown>;
  readonly disconnect: () => Promise<void>;
  readonly switchNetwork: (chainId: EvmChainId) => Promise<unknown>;
  readonly registerToken: (
    tokenSpec: TokenSpec,
    ecosystemId: EcosystemId,
    chainId: EvmChainId,
  ) => Promise<unknown>;
  readonly isUnlocked: () => Promise<boolean>;
  readonly hasConnectedBefore: () => Promise<boolean>;
  readonly protocol: EvmProtocol;
}

export class EvmWeb3WalletAdapter
  extends EventEmitter
  implements EvmWalletAdapter
{
  readonly serviceName: string;
  readonly serviceUrl: string;
  readonly protocol: EvmProtocol;
  address: string | null;
  readonly isUnlocked: () => Promise<boolean>;
  private readonly getWalletProvider: () => Web3Provider | null;
  private connecting: boolean;

  constructor(
    serviceName: string,
    serviceUrl: string,
    getWalletProvider: () => Web3Provider | null,
    isUnlocked: () => Promise<boolean> = () => Promise.resolve(false),
  ) {
    super();
    this.serviceName = serviceName;
    this.serviceUrl = serviceUrl;
    this.getWalletProvider = getWalletProvider;
    this.isUnlocked = isUnlocked;
    this.address = null;
    this.connecting = false;
    this.protocol = EVM_PROTOCOL;
  }

  public get connected(): boolean {
    return !!this.address;
  }

  public get signer(): Signer | null {
    return this.getWalletProvider()?.getSigner() ?? null;
  }

  private get walletProvider(): Web3Provider | null {
    return this.getWalletProvider();
  }

  public async hasConnectedBefore(): Promise<boolean> {
    const provider = this.getWalletProvider();
    if (!provider) return false;
    try {
      return (await provider.send("eth_accounts", [])).length > 0;
    } catch {
      return false;
    }
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

      const sentryContextKey = await this.sentryContextKey();
      Sentry.setContext(sentryContextKey, {
        walletName: this.serviceName,
        address: this.address,
      });
      const level: SeverityLevel = "info";
      Sentry.addBreadcrumb({
        category: "wallet",
        message: `Connected to ${sentryContextKey} ${this.address}`,
        level,
      });
    } catch (error) {
      await this.disconnect();
      captureException(error);
    }
    this.connecting = false;
  }

  async disconnect(): Promise<void> {
    if (this.address) {
      this.address = null;
      this.emit("disconnect");

      const sentryContextKey = await this.sentryContextKey();
      Sentry.setContext(sentryContextKey, {});
      const level: SeverityLevel = "info";
      Sentry.addBreadcrumb({
        category: "wallet",
        message: `Disconnected from ${sentryContextKey}`,
        level,
      });
    }
  }

  async switchNetwork(chainId: EvmChainId): Promise<void> {
    if (!this.walletProvider) {
      throw new Error("No wallet provider");
    }

    try {
      await this.walletProvider.send("wallet_switchEthereumChain", [
        { chainId: hexValue(chainId) },
      ]);
    } catch (switchError: any) {
      if (switchError.code === METAMASK_unrecognizedChainId) {
        const evmSpec = ALL_UNIQUE_CHAINS[EVM_PROTOCOL].find(
          (spec) => spec.chainId === chainId,
        );
        if (!evmSpec) {
          throw new Error("No EVM spec found for chain ID");
        }
        const ecosystem = ECOSYSTEMS[evmSpec.ecosystemId];
        // this also asks to switch to that chain afterwards
        await this.walletProvider.send("wallet_addEthereumChain", [
          {
            chainId: hexValue(chainId),
            chainName: evmSpec.name,
            nativeCurrency: ecosystem.gasToken.symbol,
            rpcUrls: evmSpec.publicRpcUrl,
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

  async registerToken(
    tokenSpec: TokenSpec,
    ecosystemId: EcosystemId,
    chainId: EvmChainId,
  ): Promise<boolean> {
    if (!this.walletProvider) {
      throw new Error("No wallet provider");
    }
    const details = tokenSpec.detailsByEcosystem.get(ecosystemId);
    if (!details) {
      throw new Error(
        `No ${ECOSYSTEMS[ecosystemId].displayName} details for token`,
      );
    }
    await this.switchNetwork(chainId);

    await sleep(200); // Sleep briefly, otherwise Metamask ignores the second prompt

    const wasAdded: boolean = await this.walletProvider.send(
      "wallet_watchAsset",
      {
        type: "ERC20", // Initially only supports ERC20, but eventually more!
        options: {
          address: details.address, // The address that the token is at.
          symbol: tokenSpec.project.symbol, // A ticker symbol or shorthand, up to 5 chars.
          decimals: details.decimals, // The number of decimals in the token
          // TODO: image: tokenSpec.icon, // A string url of the token logo
        },
      } as any,
    );
    return wasAdded;
  }

  private async sentryContextKey(): Promise<string> {
    try {
      const network = await this.getWalletProvider()?.getNetwork();
      return `${network?.name || "Unknown Network"} Wallet`;
    } catch {
      return `Unknown Network Wallet`;
    }
  }
}
