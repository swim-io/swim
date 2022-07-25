import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers, deployments } from "hardhat";

describe("Deployment", () => {
  let deployer: SignerWithAddress;
  let Routing: Contract;
  let Pool: Contract;

  beforeEach(async () => {
    [deployer] = await ethers.getSigners();
    const { RoutingProxy, PoolProxy, RoutingLogic } = await deployments.fixture();
  });
});
