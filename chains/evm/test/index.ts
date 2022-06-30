import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";

describe("Routing", function () {
  let routingFactory: ContractFactory;
  let routing: Contract;

  beforeEach(async function () {
    routingFactory = await ethers.getContractFactory("Routing");
    routing = await routingFactory.deploy();
  });

  // it("Should return the new greeting once it's changed", async function () {
  //   expect(await routing.greet()).to.equal("Hello, world!");

  //   const setGreetingTx = await routing.setGreeting("Hola, mundo!");

  //   // wait until the transaction is mined
  //   await setGreetingTx.wait();

  //   expect(await routing.greet()).to.equal("Hola, mundo!");
  // });
});
