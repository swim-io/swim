import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import 'hardhat-deploy';
import "@nomiclabs/hardhat-ethers";
import { deployProxy } from "../../utils/factoryDeploy";
import { Pool } from "../../typechain-types/contracts/Pool";
import { getArtifactFromContractOutput } from 'hardhat/internal/artifacts';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployer, governance, governanceFeeRecipient} = await hre.getNamedAccounts();
  const {ethers} = hre;
  const {get, getArtifact, save} = hre.deployments;

  const tokens = await (async () => {
    const tokenNames = ["swimUSD", "USDC", "USDT"];
    const tokenCts = await Promise.all(tokenNames.map(token => get(token)));
    return Object.fromEntries(tokenNames.map((_,i) => [tokenNames[i], tokenCts[i]]));
  })();

  const pool = await get("Pool");
  const lpName = "Test Pool LP";
  const lpSymbol = "LP";
  const lpSalt = "0x"+"00".repeat(31)+"11";
  const tokenEqualizer = -12; //keep 6 of the 18 decimals (all tokens have 18 decimals)
  const ampFactor = 1_000; //1 with 3 decimals
  const lpFee = 300; //fee as 100th of a bip (6 decimals, 1 = 100 % fee)
  const governanceFee = 100;
  const initializeEncoded = (new ethers.utils.Interface(pool.abi))
    .encodeFunctionData(
      "initialize",
      [
        lpName,
        lpSymbol,
        lpSalt,
        tokenEqualizer,
        [tokens["swimUSD"].address, tokens["USDC"].address, tokens["USDT"].address],
        [tokenEqualizer, tokenEqualizer, tokenEqualizer],
        ampFactor,
        lpFee,
        governanceFee,
        governance,
        governanceFeeRecipient
      ],
  );

  const poolSalt = "0x"+"00".repeat(31)+"01";
  const poolProxy = await deployProxy("PoolProxy", "Pool", poolSalt, hre, initializeEncoded);
  console.log("PoolProxy:", poolProxy.address);
  //TODO save lp token as deployment
  //console.log(JSON.stringify(await hre.network.provider.send("eth_getCode", [poolProxy.address])));
  const epp = await ethers.getContract("PoolProxy") as Pool;
  const state = await epp.getState();
  const lpProxyAddress = state.totalLPSupply.tokenAddress;
  const lpTokenProxy = {
    ...await getArtifact("LpToken"),
    address: lpProxyAddress,
    receipt: poolProxy.receipt,
    transactionHash: poolProxy.transactionHash,
    args: [lpName, lpSymbol],
  };
  console.log("LpTokenProxy:", lpProxyAddress);
  await save("LpTokenProxy", lpTokenProxy);
};
export default func;
func.id = 'Pool';
func.tags = ['PoolTest'];
func.dependencies = ["LogicContracts", "Tokens"]
