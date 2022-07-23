import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers, deployments, getNamedAccounts, getUnnamedAccounts } from "hardhat";

import { setupUsers, setupUser } from "./utils";

async function setup() {
  await deployments.fixture(["Routing"]);

  const contracts = {
    Routing: await ethers.getContract("Routing"),
  };

  const { deployer } = await getNamedAccounts();
  const users = await setupUsers(await getUnnamedAccounts(), contracts);

  return {
    ...contracts,
    users,
    deployer: await setupUser(deployer, contracts),
  };
}

describe("Routing", async () => {
  const { fixture, get, execute, read } = deployments;
  const { deployer, governance, testLiquidityProvider, testUser } = await getNamedAccounts();

  // let routingFactory: ContractFactory;
  // let routing: Contract;

  // beforeEach(async function () {
  //   routingFactory = await ethers.getContractFactory("Routing");
  //   routing = await routingFactory.deploy();
  // });

  // it("Should return the new greeting once it's changed", async function () {
  //   expect(await routing.greet()).to.equal("Hello, world!");

  //   const setGreetingTx = await routing.setGreeting("Hola, mundo!");

  //   // wait until the transaction is mined
  //   await setGreetingTx.wait();

  //   expect(await routing.greet()).to.equal("Hola, mundo!");
  // });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      await fixture(["Routing"]);
      const poolProxy = await get("Routing");
      expect(await read("PoolProxy", {}, "governance")).to.equal(governance);
      expect(await read("LpTokenProxy", {}, "owner")).to.equal(poolProxy.address);
      // const { Routing } = await setup();

      // const { deployer } = await getNamedAccounts();
      // console.log("owner", deployer);
      // expect(await Routing.owner()).to.equal(owner);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      //  const { Routing, owner } = await setup();
      //  const routingOwner = await Routing.owner();
      //  expect(owner).to.equal(routingOwner);
    });
  });
});
