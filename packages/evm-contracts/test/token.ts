import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BN } from "bn.js";
import { expect } from "chai";
import type { Contract } from "ethers";
import { ethers } from "hardhat";

describe("Token contract", function () {
  const name = "SwimUSD";
  const symbol = "swimUSD";

  const initialSupply = new BN(1000000);

  async function deployTokenFixture() {
    const Token = await ethers.getContractFactory("ERC20Token");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hardhatToken = await Token.deploy(name, symbol, 18);

    await hardhatToken.deployed();

    return { Token, hardhatToken, owner, addr1, addr2 };
  }

  describe("Deployment", () => {
    let hardhatToken: Contract;
    let owner: SignerWithAddress;
    beforeEach(async () => {
      const data = await loadFixture(deployTokenFixture);
      hardhatToken = data.hardhatToken;
      owner = data.owner;
    });
    it("Should set the right owner", async () => {
      expect(await hardhatToken.owner()).to.equal(owner.address);
    });

    it("Should mint initial supply", async () => {
      await hardhatToken.mint(owner.address, initialSupply.toString());
      expect(await hardhatToken.totalSupply()).to.equal(initialSupply.toString());
    });

    it("Should assign the total supply of tokens to the owner", async () => {
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  // describe("Transactions", function () {
  //   it("Should transfer tokens between accounts", async function () {
  //     const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
  //     // Transfer 50 tokens from owner to addr1
  //     await expect(hardhatToken.transfer(addr1.address, 50)).to.changeTokenBalances(
  //       hardhatToken,
  //       [owner, addr1],
  //       [-50, 50]
  //     );

  //     // Transfer 50 tokens from addr1 to addr2
  //     // We use .connect(signer) to send a transaction from another account
  //     await expect(hardhatToken.connect(addr1).transfer(addr2.address, 50)).to.changeTokenBalances(
  //       hardhatToken,
  //       [addr1, addr2],
  //       [-50, 50]
  //     );
  //   });

  //   it("should emit Transfer events", async function () {
  //     const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);

  //     // Transfer 50 tokens from owner to addr1
  //     await expect(hardhatToken.transfer(addr1.address, 50))
  //       .to.emit(hardhatToken, "Transfer")
  //       .withArgs(owner.address, addr1.address, 50);

  //     // Transfer 50 tokens from addr1 to addr2
  //     // We use .connect(signer) to send a transaction from another account
  //     await expect(hardhatToken.connect(addr1).transfer(addr2.address, 50))
  //       .to.emit(hardhatToken, "Transfer")
  //       .withArgs(addr1.address, addr2.address, 50);
  //   });

  //   it("Should fail if sender doesn't have enough tokens", async function () {
  //     const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
  //     const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

  //     // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
  //     // `require` will evaluate false and revert the transaction.
  //     await expect(hardhatToken.connect(addr1).transfer(owner.address, 1)).to.be.revertedWith(
  //       "Not enough tokens"
  //     );

  //     // Owner balance shouldn't have changed.
  //     expect(await hardhatToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
  //   });
  // });
});
