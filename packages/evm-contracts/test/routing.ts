import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades, deployments } from "hardhat";

describe("Deployment", () => {
  let deployer: SignerWithAddress;
  let testUser: SignerWithAddress;
  let Routing: Contract;
  let Pool: Contract;
  const tokenAddress = "0xF890982f9310df57d00f659cf4fd87e65adEd8d7";
  const swimUSDAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

  async function deployTokenFixture() {
    const RoutingFactory = await ethers.getContractFactory("Routing");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const routingProxy = await upgrades.deployProxy(RoutingFactory, []);

    return { RoutingFactory, routingProxy, owner, addr1, addr2 };
  }

  beforeEach(async () => {
    const data = await loadFixture(deployTokenFixture);
    Routing = data.routingProxy;
    deployer = data.owner;
    testUser = data.addr1;
  });

  it("Should set the right owner", async () => {
    const tokenBridgeAddrV2 = "0xF890982f9310df57d00f659cf4fd87e65adEd8d8";
    const proxy = Routing.address;

    await Routing.connect(deployer).initialize(tokenAddress);
    const routingV2 = await ethers.getContractFactory("RoutingV2");
    const upgraded = await upgrades.upgradeProxy(Routing.address, routingV2);

    expect(upgraded.address).to.equal(proxy);

    expect(await upgraded.tokenBridge().address).to.equal(tokenAddress);

    // New function is available
    await upgraded.connect(deployer).changeTokenBridge(tokenBridgeAddrV2);
    expect(await Routing.tokenBridge().address).to.equal(tokenBridgeAddrV2);
  });

  it("Should initialize token address", async () => {
    // console.log("Routing", Routing);
    // await Routing.initialize(tokenAddress);
    // expect(await Routing.tokenBridge()).to.equal(tokenAddress);
  });
});
