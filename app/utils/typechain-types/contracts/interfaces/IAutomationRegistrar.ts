/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedListener,
  TypedContractMethod,
} from "../../common";

export interface IAutomationRegistrarInterface extends Interface {
  getFunction(
    nameOrSignature: "onTokenTransfer" | "register"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "onTokenTransfer",
    values: [AddressLike, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "register",
    values: [
      string,
      BytesLike,
      AddressLike,
      BigNumberish,
      AddressLike,
      BigNumberish,
      BytesLike,
      BytesLike,
      BytesLike,
      BigNumberish,
      AddressLike
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "onTokenTransfer",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "register", data: BytesLike): Result;
}

export interface IAutomationRegistrar extends BaseContract {
  connect(runner?: ContractRunner | null): IAutomationRegistrar;
  waitForDeployment(): Promise<this>;

  interface: IAutomationRegistrarInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  onTokenTransfer: TypedContractMethod<
    [sender: AddressLike, amount: BigNumberish, data: BytesLike],
    [boolean],
    "nonpayable"
  >;

  register: TypedContractMethod<
    [
      name: string,
      encryptedEmail: BytesLike,
      upkeepContract: AddressLike,
      gasLimit: BigNumberish,
      adminAddress: AddressLike,
      triggerType: BigNumberish,
      checkData: BytesLike,
      triggerConfig: BytesLike,
      offchainConfig: BytesLike,
      amount: BigNumberish,
      sender: AddressLike
    ],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "onTokenTransfer"
  ): TypedContractMethod<
    [sender: AddressLike, amount: BigNumberish, data: BytesLike],
    [boolean],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "register"
  ): TypedContractMethod<
    [
      name: string,
      encryptedEmail: BytesLike,
      upkeepContract: AddressLike,
      gasLimit: BigNumberish,
      adminAddress: AddressLike,
      triggerType: BigNumberish,
      checkData: BytesLike,
      triggerConfig: BytesLike,
      offchainConfig: BytesLike,
      amount: BigNumberish,
      sender: AddressLike
    ],
    [void],
    "nonpayable"
  >;

  filters: {};
}
