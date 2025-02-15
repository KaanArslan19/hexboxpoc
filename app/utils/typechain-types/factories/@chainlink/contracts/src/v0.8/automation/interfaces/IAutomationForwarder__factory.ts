/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IAutomationForwarder,
  IAutomationForwarderInterface,
} from "../../../../../../../@chainlink/contracts/src/v0.8/automation/interfaces/IAutomationForwarder";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "gasAmount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "forward",
    outputs: [
      {
        internalType: "bool",
        name: "success",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "gasUsed",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getRegistry",
    outputs: [
      {
        internalType: "contract IAutomationRegistryConsumer",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTarget",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "typeAndVersion",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newRegistry",
        type: "address",
      },
    ],
    name: "updateRegistry",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class IAutomationForwarder__factory {
  static readonly abi = _abi;
  static createInterface(): IAutomationForwarderInterface {
    return new Interface(_abi) as IAutomationForwarderInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): IAutomationForwarder {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as IAutomationForwarder;
  }
}
