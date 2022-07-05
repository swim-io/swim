import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";

describe("Routing", function () {
  let greeterFactory: ContractFactory;
  let greeter: Contract;

  beforeEach(async function () {
    greeterFactory = await ethers.getContractFactory("Greeter");
    greeter = await greeterFactory.deploy();
  });

  it("Should return the new greeting once it's changed", async function () {
    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
