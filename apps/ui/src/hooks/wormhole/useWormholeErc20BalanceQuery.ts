import Decimal from "decimal.js";
import { WormholeTokenDetails } from "models";
import { useQuery, UseQueryResult } from "react-query";
import { ERC20__factory } from "@swim-io/evm-contracts";
import { useEvmWallet } from "hooks";
import { isEVMChain } from "@certusone/wormhole-sdk";
import { EVM_NETWORKS } from "config";
import { utils as ethersUtils } from "ethers";

export const useWormholeErc20BalanceQuery = ({
  chainId,
  address,
  decimals,
}: WormholeTokenDetails): UseQueryResult<Decimal | null, Error> => {
  const { wallet } = useEvmWallet();

  return useQuery<Decimal | null, Error>(
    ["wormhole", "erc20Balance", chainId, address, wallet?.address],
    async () => {
      if (!wallet?.address || !isEVMChain(chainId)) {
        return null;
      }
      const evmNetwork = EVM_NETWORKS[chainId];
      await wallet.switchNetwork(evmNetwork);
      const { provider } = wallet.signer ?? {};
      if (!provider) {
        return null;
      }
      const erc20Contract = ERC20__factory.connect(address, provider);
      try {
        const balance = await erc20Contract.balanceOf(wallet.address);
        return new Decimal(ethersUtils.formatUnits(balance, decimals));
      } catch {
        return new Decimal(0);
      }
    },
    {},
  );
};
