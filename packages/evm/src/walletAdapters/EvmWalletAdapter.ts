import type { TokenDetails } from "@swim-io/core";
import type { TokenProjectId } from "@swim-io/token-projects";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { sleep } from "@swim-io/utils";
import type { Signer } from "ethers";
import { ethers } from "ethers";
import EventEmitter from "eventemitter3";

import { EVM_ECOSYSTEMS } from "../ecosystems";
import type { EvmProtocol } from "../protocol";
import { EVM_PROTOCOL } from "../protocol";

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
  readonly switchNetwork: (chainId: number) => Promise<unknown>;
  readonly registerToken: (
    tokenDetails: TokenDetails,
    projectId: TokenProjectId,
    chainId: number,
  ) => Promise<unknown>;
  readonly isUnlocked: () => Promise<boolean>;
  readonly hasConnectedBefore: () => Promise<boolean>;
  readonly protocol: EvmProtocol;
  // for logging
  readonly serviceName: string;
  // for logging
  readonly getNetworkName: () => Promise<string | null>;
}

export class EvmWeb3WalletAdapter
  extends EventEmitter
  implements EvmWalletAdapter
{
  public readonly serviceName: string;
  public readonly serviceUrl: string;
  public readonly getWalletProvider: () => Web3Provider | null;
  public readonly isUnlocked: () => Promise<boolean>;
  public readonly protocol: EvmProtocol;
  public address: string | null;
  private connecting: boolean;

  public constructor(
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

  public async getNetworkName(): Promise<string | null> {
    try {
      return (await this.getWalletProvider()?.getNetwork())?.name ?? null;
    } catch {
      return null;
    }
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

  public async connect(): Promise<void> {
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
    } catch (error) {
      await this.disconnect();
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async disconnect(): Promise<void> {
    if (this.address) {
      this.address = null;
      this.emit("disconnect");
    }
  }

  public async switchNetwork(chainId: number): Promise<void> {
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
        const configs = Object.values(EVM_ECOSYSTEMS)
          .flatMap(({ chains, ...ecosystemConfig }) =>
            [...chains].map(([, chainConfig]) => ({
              ecosystemConfig,
              chainConfig,
            })),
          )
          .find(({ chainConfig }) => chainConfig.chainId === chainId);
        if (!configs) {
          throw new Error("No EVM ecosystem config found for chain ID");
        }

        // this also asks to switch to that chain afterwards
        await this.walletProvider.send("wallet_addEthereumChain", [
          {
            chainId: hexValue(chainId),
            chainName: configs.chainConfig.name,
            nativeCurrency: configs.ecosystemConfig.gasToken,
            rpcUrls: configs.chainConfig.publicRpcUrls,
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

  public async registerToken(
    tokenDetails: TokenDetails,
    projectId: TokenProjectId,
    chainId: number,
  ): Promise<boolean> {
    if (!this.walletProvider) {
      throw new Error("No wallet provider");
    }

    await this.switchNetwork(chainId);

    await sleep(200); // Sleep briefly, otherwise Metamask ignores the second prompt

    const wasAdded = (await this.walletProvider.send("wallet_watchAsset", {
      // @ts-expect-error the type is wrong in walletProvider.send, the params should not be an array
      type: "ERC20", // Initially only supports ERC20, but eventually more!
      options: {
        address: tokenDetails.address, // The address that the token is at.
        symbol: TOKEN_PROJECTS_BY_ID[projectId].symbol, // A ticker symbol or shorthand, up to 5 chars.
        decimals: tokenDetails.decimals, // The number of decimals in the token
        image: TOKEN_PROJECTS_BY_ID[projectId].icon, // A string url of the token logo
      },
    })) as boolean;
    return wasAdded;
  }
}
