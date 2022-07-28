import * as Sentry from "@sentry/react";
import type { SeverityLevel } from "@sentry/types";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { sleep } from "@swim-io/utils";
import type { Signer } from "ethers";
import { ethers } from "ethers";
import EventEmitter from "eventemitter3";

import type { EcosystemId, EvmChainId, TokenSpec } from "../../../../config";
import {
  ALL_UNIQUE_CHAINS,
  ECOSYSTEMS,
  Protocol,
  getTokenDetailsForEcosystem,
} from "../../../../config";
import { captureException } from "../../../../errors";

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
  readonly protocol: Protocol.Evm;
}

export class EvmWeb3WalletAdapter
  extends EventEmitter
  implements EvmWalletAdapter
{
  readonly serviceName: string;
  readonly serviceUrl: string;
  readonly protocol: Protocol.Evm;
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
    this.protocol = Protocol.Evm;
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
      return (
        ((await provider.send("eth_accounts", [])) as readonly any[]).length > 0
      );
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
      const [address] = (await this.walletProvider.send(
        "eth_requestAccounts",
        [],
      )) as readonly string[];
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
        message: `Connected to ${sentryContextKey} ${String(this.address)}`,
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
    } catch (switchError: unknown) {
      if (
        (switchError as Record<string, unknown>).code ===
        METAMASK_unrecognizedChainId
      ) {
        const evmSpec = ALL_UNIQUE_CHAINS[Protocol.Evm].find(
          (spec) => spec.chainId === chainId,
        );
        if (!evmSpec) {
          throw new Error("No EVM spec found for chain ID");
        }
        // this also asks to switch to that chain afterwards
        await this.walletProvider.send("wallet_addEthereumChain", [
          {
            chainId: hexValue(chainId),
            chainName: evmSpec.chainName,
            nativeCurrency: evmSpec.nativeCurrency,
            rpcUrls: evmSpec.rpcUrls,
          },
        ]);
      } else if (
        (switchError as Record<string, unknown>).code ===
        METAMASK_methodNotFound
      ) {
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
    const details = getTokenDetailsForEcosystem(tokenSpec, ecosystemId);
    if (!details) {
      throw new Error(
        `No ${ECOSYSTEMS[ecosystemId].displayName} details for token`,
      );
    }
    await this.switchNetwork(chainId);

    await sleep(200); // Sleep briefly, otherwise Metamask ignores the second prompt

    const wasAdded = (await this.walletProvider.send("wallet_watchAsset", {
      // @ts-expect-error the type is wrong in walletProvider.send, the params should not be an array
      type: "ERC20", // Initially only supports ERC20, but eventually more!
      options: {
        address: details.address, // The address that the token is at.
        symbol: TOKEN_PROJECTS_BY_ID[tokenSpec.projectId].symbol, // A ticker symbol or shorthand, up to 5 chars.
        decimals: details.decimals, // The number of decimals in the token
        // TODO: image: tokenSpec.icon, // A string url of the token logo
      },
    })) as boolean;
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
