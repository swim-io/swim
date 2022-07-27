/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../common";

export interface IDeterministicFactoryInterface extends utils.Interface {
  functions: {
    "createLogic(bytes,bytes32)": FunctionFragment;
    "createProxy(address,bytes32,bytes)": FunctionFragment;
    "determineLogicAddress(bytes,bytes32)": FunctionFragment;
    "determineProxyAddress(bytes32)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "createLogic"
      | "createProxy"
      | "determineLogicAddress"
      | "determineProxyAddress"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "createLogic",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "createProxy",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "determineLogicAddress",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "determineProxyAddress",
    values: [PromiseOrValue<BytesLike>]
  ): string;

  decodeFunctionResult(
    functionFragment: "createLogic",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createProxy",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "determineLogicAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "determineProxyAddress",
    data: BytesLike
  ): Result;

  events: {};
}

export interface IDeterministicFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IDeterministicFactoryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    createLogic(
      code: PromiseOrValue<BytesLike>,
      salt: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    createProxy(
      implementation: PromiseOrValue<string>,
      salt: PromiseOrValue<BytesLike>,
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    determineLogicAddress(
      code: PromiseOrValue<BytesLike>,
      salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    determineProxyAddress(
      salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[string]>;
  };

  createLogic(
    code: PromiseOrValue<BytesLike>,
    salt: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  createProxy(
    implementation: PromiseOrValue<string>,
    salt: PromiseOrValue<BytesLike>,
    call: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  determineLogicAddress(
    code: PromiseOrValue<BytesLike>,
    salt: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<string>;

  determineProxyAddress(
    salt: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<string>;

  callStatic: {
    createLogic(
      code: PromiseOrValue<BytesLike>,
      salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    createProxy(
      implementation: PromiseOrValue<string>,
      salt: PromiseOrValue<BytesLike>,
      call: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    determineLogicAddress(
      code: PromiseOrValue<BytesLike>,
      salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    determineProxyAddress(
      salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {};

  estimateGas: {
    createLogic(
      code: PromiseOrValue<BytesLike>,
      salt: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    createProxy(
      implementation: PromiseOrValue<string>,
      salt: PromiseOrValue<BytesLike>,
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    determineLogicAddress(
      code: PromiseOrValue<BytesLike>,
      salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    determineProxyAddress(
      salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    createLogic(
      code: PromiseOrValue<BytesLike>,
      salt: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    createProxy(
      implementation: PromiseOrValue<string>,
      salt: PromiseOrValue<BytesLike>,
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    determineLogicAddress(
      code: PromiseOrValue<BytesLike>,
      salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    determineProxyAddress(
      salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
