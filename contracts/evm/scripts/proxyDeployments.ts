const { ethers, upgrades } = require("hardhat");

export async function deployProxy() {
  const Routing = await ethers.getContractFactory("Routing");
  const routing = await upgrades.deployProxy(Routing);
  await routing.deployed();
  console.log("Routing deployed to:", routing.address);
}

export async function upgradeProxy() {
  const RouterV2 = await ethers.getContractFactory("RouterV2");
  const routing = await upgrades.upgradeProxy("ROUTER_PROXY_ADDRESS", RouterV2);
  console.log("Routing upgraded", routing);
}
