import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades, deployments } from "hardhat";

describe("Deployment", async () => {
  let RoutingFactory: ContractFactory;
  let Pool: Contract;
  const tokenAddress = "0xF890982f9310df57d00f659cf4fd87e65adEd8d7";
  const swimUSDAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    RoutingFactory = await ethers.getContractFactory("Routing");
    const routingProxy = await upgrades.deployProxy(RoutingFactory, [tokenAddress], {
      initializer: "initialize",
      kind: "uups",
    });
    await routingProxy.deployed();

    return { RoutingFactory, routingProxy, owner, addr1, addr2 };
  }
  describe("Routing", async () => {
    let deployer: SignerWithAddress;
    let testUser: SignerWithAddress;
    let RoutingProxy: Contract;

    beforeEach(async () => {
      const data = await loadFixture(deployFixture);
      RoutingProxy = data.routingProxy;
      deployer = data.owner;
      testUser = data.addr1;
    });

    it("Should set the right owner", async () => {
      console.log("Routing", RoutingProxy);
      expect(await RoutingProxy.owner()).to.equal(deployer.address);
    });

    it("Should initialize token address", async () => {
      // console.log("Routing", Routing);
      // await Routing.initialize(tokenAddress);
      // expect(await Routing.tokenBridge()).to.equal(tokenAddress);
    });
  });
});
