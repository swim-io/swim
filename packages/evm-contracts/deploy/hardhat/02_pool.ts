import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import 'hardhat-deploy';
import "@nomiclabs/hardhat-ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployer, governance, governanceFeeRecipient} = await hre.getNamedAccounts();
  const {ethers} = hre;
  const {deploy, get, save, execute} = hre.deployments;

  const lpTokenLogic = await get("LpTokenLogic");
  const lpTokenProxy = await deploy('ERC1967Proxy', {
    from: deployer,
    args: [lpTokenLogic.address, []], //properly initialized by the pool contract!
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
  //save with the underlying logic contract abi
  await save("LpTokenProxy", {abi: lpTokenLogic.abi, address: lpTokenProxy.address})

  const tokens = await (async () => {
    const tokenNames = ["swimUSD", "USDC", "USDT"];
    const tokenCts = await Promise.all(tokenNames.map(token => get(token)));
    return Object.fromEntries(tokenNames.map((_,i) => [tokenNames[i], tokenCts[i]]));
  })();

  const poolLogic = await get("PoolLogic");
  const tokenEqualizer = -12; //keep 6 of the 18 decimals (all tokens have 18 decimals)
  const ampFactor = 1<<10;
  const lpFee = 300; //fee as 100th of a bip (6 decimals, 1 = 100 % fee)
  const governanceFee = 100;
  const initializeEncoded = (new ethers.utils.Interface(poolLogic.abi))
    .encodeFunctionData(
      "initialize",
      [
        "Test Pool LP",
        "LP",
        lpTokenProxy.address,
        tokenEqualizer,
        [tokens["swimUSD"].address, tokens["USDC"].address, tokens["USDT"].address],
        [tokenEqualizer, tokenEqualizer, tokenEqualizer],
        ampFactor,
        lpFee,
        governanceFee,
        governanceFeeRecipient
      ],
  );

  const poolProxy = await deploy('ERC1967Proxy', {
    from: deployer,
    args: [poolLogic.address, initializeEncoded],
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
  await save("PoolProxy", {abi: poolLogic.abi, address: poolProxy.address});

  await execute("PoolProxy", {from: deployer}, "transferGovernance", governance);
};
export default func;
func.id = 'Pool';
func.tags = ['PoolTest'];
func.dependencies = ["LogicContracts", "Tokens"]
