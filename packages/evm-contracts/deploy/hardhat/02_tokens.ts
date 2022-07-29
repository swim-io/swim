import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import 'hardhat-deploy';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployer} = await hre.getNamedAccounts();
  const {deploy, save} = hre.deployments;

  const tokens = [["USD Coin", "USDC"], ["Tether", "USDT"], ["SwimUSD", "swimUSD"]];
  for (const [name, symbol] of tokens) {
    const deployedContract = await deploy('ERC20Token', {
      from: deployer,
      args: [name, symbol],
      autoMine: true,
    });
    console.log(symbol + ":", deployedContract.address);
    await save(symbol, deployedContract);
  }
};
export default func;
func.id = 'Tokens'; // id required to prevent reexecution
func.tags = ['PoolTest'];
