import { BigNumber, formatFixed, parseFixed } from "@ethersproject/bignumber";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BN } from "bn.js";
import { expect, use } from "chai";
import CBN from "chai-bn";
import type { Contract } from "ethers";
import { ethers } from "hardhat";

import { FACTORY_PRESIGNED, SALTS } from "../src/config";
import { deployLogic, deployPoolAndRegister, deployProxy } from "../src/deploy";

describe("Pool Defi Operations", function () {
  const baseAmount = BigNumber.from("10");
  const tolerance = 2;

  before(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    use(CBN(BN));
  });

  async function testFixture() {
    const [deployer, governance, govFeeRecip, liquidityProvider, user] = await ethers.getSigners();

    const tokenWrapper = (contract: Contract, decimals: number) => {
      const address = contract.address;

      const toAtomic = (human: BigNumber | string | number) =>
        parseFixed(typeof human === "string" ? human : human.toString(), decimals);

      const toHuman = (atomic: BigNumber) => formatFixed(atomic, decimals);

      const balanceOf = async (account: { readonly address: string }) =>
        await contract.balanceOf(account.address);

      const mint = async (to: { readonly address: string }, amount: BigNumber) =>
        await contract.connect(deployer).mint(to.address, amount);

      const approve = async (
        from: SignerWithAddress,
        to: { readonly address: string },
        amount: BigNumber
      ) => await contract.connect(from).approve(to.address, amount);

      return { contract, address, toAtomic, toHuman, balanceOf, mint, approve };
    };

    //deploy erc20 tokens
    const tokenData = [
      ["swimUSD", "SwimUSD", 8],
      ["USDC", "USD Coin", 6],
      ["USDT", "Tether", 6],
    ];
    const [swimUSD, usdc, usdt] = await Promise.all(
      tokenData.map(async ([symbol, name, decimals], tokenNumber) => {
        const erc20Factory = await ethers.getContractFactory("ERC20Token");
        const contract = await (
          await erc20Factory.deploy(name as string, symbol as string, decimals as number)
        ).deployed();
        return Object.assign(tokenWrapper(contract, decimals as number), { tokenNumber });
      })
    );
    const tokens = [swimUSD, usdc, usdt];

    //deploy MockTokenBridge
    const mockTokenBridge = await (
      await ethers.getContractFactory("MockTokenBridge")
    ).deploy(swimUSD.address);

    //deploy SwimFactory via presigned tx
    await deployer.sendTransaction({
      to: FACTORY_PRESIGNED.from,
      value: FACTORY_PRESIGNED.maxCost,
    });
    await ethers.provider.sendTransaction(FACTORY_PRESIGNED.signedTx);

    //deploy Swim Contracts through factory
    const routingLogic = await deployLogic("Routing", SALTS.routingLogic);
    await deployLogic("LpToken", SALTS.lpToken);
    const poolLogic = await deployLogic("Pool", SALTS.poolLogic);
    const routing = await deployProxy(routingLogic, SALTS.routingProxy, [
      deployer.address,
      mockTokenBridge.address,
    ]);

    const lpDecimals = 6;
    const pool = await deployPoolAndRegister(
      {
        salt: "0x" + "00".repeat(31) + "01",
        lpSalt: "0x" + "00".repeat(31) + "11",
        lpDecimals,
        ampFactor: 1000,
        lpFee: 300,
        govFee: 100,
        tokens: [
          //TODO use token.pick(["address", "tokenNumber"]) from utils package
          { address: usdc.address, tokenNumber: usdc.tokenNumber },
          { address: usdt.address, tokenNumber: usdt.tokenNumber },
        ],
      },
      poolLogic,
      routing,
      governance,
      govFeeRecip
    );

    const lpToken = tokenWrapper(
      await ethers.getContractAt("LpToken", (await pool.getLpToken()) as string),
      lpDecimals
    );

    for (const token of tokens) {
      await token.mint(liquidityProvider, token.toAtomic(baseAmount));
      await token.approve(liquidityProvider, pool, token.toAtomic(baseAmount));
    }

    await pool.connect(liquidityProvider).add(
      tokens.map((t) => t.toAtomic(baseAmount)),
      0
    );

    await usdc.mint(user, usdc.toAtomic(1));
    await usdc.approve(user, pool, usdc.toAtomic(1));

    type AtomicConversionSupported = string | BigNumber | number;
    const toAtomicAmounts = (
      human: AtomicConversionSupported | readonly AtomicConversionSupported[]
    ) =>
      tokens.map((t, i) =>
        t.toAtomic((Array.isArray(human) ? human[i] : human) as AtomicConversionSupported)
      );

    return {
      deployer,
      governance,
      govFeeRecip,
      liquidityProvider,
      user,
      pool,
      swimUSD,
      usdc,
      usdt,
      lpToken,
      toAtomicAmounts,
    };
  }

  it("Check basic pool deployment parameters", async function () {
    const { pool, governance, liquidityProvider, lpToken } = await loadFixture(testFixture);

    expect(await pool.governance()).to.equal(governance);
    expect(await lpToken.contract.owner()).to.equal(pool);
    expect(await lpToken.balanceOf(liquidityProvider)).to.equal(
      lpToken.toAtomic(baseAmount).mul(3)
    );

    //console.log(JSON.stringify(await read("PoolProxy", {}, "getState"), null, 2));
  });

  it("RemoveUniform should empty the pool and allow refilling after", async function () {
    const { pool, govFeeRecip, liquidityProvider, lpToken, swimUSD, usdc, usdt, toAtomicAmounts } =
      await loadFixture(testFixture);

    const tokens = [swimUSD, usdc, usdt];

    const lpAmount = lpToken.toAtomic(baseAmount).mul(3);
    await lpToken.approve(liquidityProvider, pool, lpAmount);
    await pool.connect(liquidityProvider).removeUniform(lpAmount, toAtomicAmounts(baseAmount));

    expect(await lpToken.balanceOf(govFeeRecip)).to.equal(0);
    expect(await lpToken.balanceOf(liquidityProvider)).to.equal(0);
    for (const token of tokens)
      expect(await token.balanceOf(liquidityProvider)).to.equal(token.toAtomic(baseAmount));

    for (const token of tokens)
      await token.approve(liquidityProvider, pool, token.toAtomic(baseAmount));

    await pool.connect(liquidityProvider).add(toAtomicAmounts(baseAmount), 0);
    expect(await lpToken.balanceOf(govFeeRecip)).to.equal(0);
    expect(await lpToken.balanceOf(liquidityProvider)).to.equal(baseAmount.mul(3));
    for (const token of tokens) expect(await token.balanceOf(liquidityProvider)).to.equal(0);
  });

  it("Add should return correct outputs", async function () {
    const { pool, govFeeRecip, lpToken, user, toAtomicAmounts } = await loadFixture(testFixture);

    await pool.connect(user).add(toAtomicAmounts([0, 1, 0]), 0);

    expect(await lpToken.balanceOf(user)).to.be.closeTo(lpToken.toAtomic("0.976045"), tolerance);
    expect(await lpToken.balanceOf(govFeeRecip)).to.be.closeTo(
      lpToken.toAtomic("0.000063"),
      tolerance
    );
  });

  it("RemoveExactBurn and RemoveExactOutput should return correct and consistent outputs", async function () {
    const setup = async () => {
      const { pool, govFeeRecip, lpToken, usdc, user, toAtomicAmounts } = await loadFixture(
        testFixture
      );

      const expectedLp = lpToken.toAtomic("0.97604522");
      const expectedUsdc = usdc.toAtomic("0.999495");
      const expectedGovFee = lpToken.toAtomic("0.000063");

      await pool.connect(user).add(toAtomicAmounts([0, 1, 0]), 0);

      expect(await lpToken.balanceOf(user)).to.equal(expectedLp);
      await lpToken.approve(user, pool, expectedLp);
      const govFee = await lpToken.balanceOf(govFeeRecip);
      //"flush" governance fee from first add for easier checking after
      const miscAddress = "0x" + "0".repeat(39) + "1";
      await lpToken.contract.connect(govFeeRecip).transfer(miscAddress, govFee);
      return { expectedLp, expectedUsdc, expectedGovFee, pool, govFeeRecip, lpToken, usdc, user };
    };

    {
      const { expectedLp, expectedUsdc, expectedGovFee, pool, govFeeRecip, lpToken, usdc, user } =
        await setup();

      await pool.connect(user).removeExactBurn(expectedLp, 1, 0);

      expect(await usdc.balanceOf(user)).to.be.closeTo(expectedUsdc, tolerance);
      expect(await lpToken.balanceOf(govFeeRecip)).to.be.closeTo(expectedGovFee, tolerance);
    }

    {
      const { expectedLp, expectedUsdc, expectedGovFee, pool, govFeeRecip, lpToken, usdc, user } =
        await setup();

      const outputAmount = expectedUsdc.sub(tolerance);
      await pool.connect(user).removeExactOutput([0, outputAmount, 0], expectedLp);

      expect(await usdc.balanceOf(user)).to.equal(outputAmount);
      expect(await lpToken.balanceOf(user)).to.be.closeTo(0, 2 * tolerance);
      expect(await lpToken.balanceOf(govFeeRecip)).to.be.closeTo(expectedGovFee, tolerance);
    }
  });

  it("Swap equals SwapExactInput exactly", async function () {
    const swap = async () => {
      const { pool, govFeeRecip, lpToken, usdc, usdt, user } = await loadFixture(testFixture);

      await pool.connect(user).swap(usdc.toAtomic(1), 1, 2, 0);
      return {
        swapUserUsdc: await usdt.balanceOf(user),
        swapGovFee: await lpToken.balanceOf(govFeeRecip),
      };
    };

    const { swapUserUsdc, swapGovFee } = await swap();

    const swapExactInput = async () => {
      const { pool, govFeeRecip, lpToken, usdt, user, toAtomicAmounts } = await loadFixture(
        testFixture
      );
      await pool.connect(user).swapExactInput(toAtomicAmounts([0, 1, 0]), 2, 0);
      return {
        swapExactInputUserUsdc: await usdt.balanceOf(user),
        swapExactInputGovFee: await lpToken.balanceOf(govFeeRecip),
      };
    };

    const { swapExactInputUserUsdc, swapExactInputGovFee } = await swapExactInput();

    expect(swapUserUsdc).to.equal(swapExactInputUserUsdc);
    expect(swapGovFee).to.equal(swapExactInputGovFee);
  });

  it("swapExactInput and SwapExactOutput should return correct and consistent outputs", async function () {
    const expectedUsdt = "0.929849";

    const swapExactInputGovFee = await (async () => {
      const { pool, govFeeRecip, lpToken, usdc, usdt, user, toAtomicAmounts } = await loadFixture(
        testFixture
      );

      await pool.connect(user).swapExactInput(toAtomicAmounts([0, 1, 0]), 2, 0);

      const remainingUsdc = await usdc.balanceOf(user);
      const actualUsdt = await usdt.balanceOf(user);

      expect(remainingUsdc).to.equal(0);
      expect(actualUsdt).to.be.closeTo(usdt.toAtomic(expectedUsdt), tolerance);

      return lpToken.balanceOf(govFeeRecip);
    })();

    const swapExactOutputGovFee = await (async () => {
      const { pool, govFeeRecip, lpToken, usdc, usdt, user, toAtomicAmounts } = await loadFixture(
        testFixture
      );

      const outputAmount = usdt.toAtomic(expectedUsdt).sub(tolerance);
      await pool
        .connect(user)
        .swapExactOutput(usdc.toAtomic(1), 1, toAtomicAmounts([0, 0, outputAmount]));

      const remainingUsdc = await usdc.balanceOf(user);
      const actualUsdt = await usdt.balanceOf(user);

      expect(remainingUsdc).to.be.closeTo(0, 2 * tolerance);
      expect(actualUsdt).to.equal(outputAmount);

      return lpToken.balanceOf(govFeeRecip);
    })();

    expect(swapExactInputGovFee).to.be.closeTo(swapExactOutputGovFee, tolerance);
  });

  it("Check marginal prices are correct for stable swap", async function () {
    const { pool, liquidityProvider, lpToken, toAtomicAmounts } = await loadFixture(testFixture);

    const expectedLpSupply = lpToken.toAtomic("16.749421");
    const expectedPrices = ["0.697954", "0.930605", "1.628559"].map((p) => parseFixed(p, 18));

    await lpToken.approve(liquidityProvider, pool, baseAmount.mul(3));
    await pool
      .connect(liquidityProvider)
      .removeExactOutput(toAtomicAmounts([1, 4, 7]), baseAmount.mul(3));

    const actualLpSupply = await lpToken.contract.totalSupply();
    const actualPrices: readonly string[] = await pool.getMarginalPrices();
    expect(actualLpSupply).to.be.closeTo(expectedLpSupply, tolerance);
    for (let i = 0; i < expectedPrices.length; ++i)
      expect(actualPrices[i]).to.be.closeTo(expectedPrices[i], tolerance);
  });

  // it("Check marginal prices are correct for constant product", async function () {
  //TODO
  // });
});
