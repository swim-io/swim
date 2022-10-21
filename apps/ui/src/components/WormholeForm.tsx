import type { ChainId, EVMChainId } from "@certusone/wormhole-sdk";
import {
  CHAIN_ID_ACALA,
  CHAIN_ID_ARBITRUM,
  CHAIN_ID_AURORA,
  CHAIN_ID_AVAX,
  CHAIN_ID_BSC,
  CHAIN_ID_CELO,
  CHAIN_ID_ETH,
  CHAIN_ID_ETHEREUM_ROPSTEN,
  CHAIN_ID_FANTOM,
  CHAIN_ID_GNOSIS,
  CHAIN_ID_KARURA,
  CHAIN_ID_KLAYTN,
  CHAIN_ID_MOONBEAM,
  CHAIN_ID_NEON,
  CHAIN_ID_OASIS,
  CHAIN_ID_OPTIMISM,
  CHAIN_ID_POLYGON,
  CHAIN_ID_SOLANA,
  CHAIN_ID_TO_NAME,
  isEVMChain,
} from "@certusone/wormhole-sdk";
import type { EuiSelectOption } from "@elastic/eui";
import {
  EuiButton,
  EuiForm,
  EuiFormRow,
  EuiSelect,
  EuiSpacer,
} from "@elastic/eui";
import { ERC20__factory } from "@swim-io/evm-contracts";
import type { ReadonlyRecord } from "@swim-io/utils";
import { findOrThrow } from "@swim-io/utils";
import Decimal from "decimal.js";
import { utils as ethersUtils } from "ethers";
import type { FormEvent, ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { wormholeTokens as rawWormholeTokens } from "../config";
import {
  useEvmWallet,
  useUserSolanaTokenBalance,
  useWormholeTransfer,
} from "../hooks";
import type { TxResult, WormholeToken, WormholeTokenDetails } from "../models";
import { generateId } from "../models";

import { EuiFieldIntlNumber } from "./EuiFieldIntlNumber";

const EVM_NETWORKS: ReadonlyRecord<EVMChainId, number> = {
  [CHAIN_ID_ETH]: 1,
  [CHAIN_ID_BSC]: 56,
  [CHAIN_ID_POLYGON]: 137,
  [CHAIN_ID_AVAX]: 43114,
  [CHAIN_ID_OASIS]: 42262,
  [CHAIN_ID_AURORA]: 1313161554,
  [CHAIN_ID_FANTOM]: 250,
  [CHAIN_ID_KARURA]: 686,
  [CHAIN_ID_ACALA]: 787,
  [CHAIN_ID_KLAYTN]: 8217,
  [CHAIN_ID_CELO]: 42220,
  [CHAIN_ID_MOONBEAM]: 1284,
  [CHAIN_ID_NEON]: 245022934,
  [CHAIN_ID_ARBITRUM]: 42161,
  [CHAIN_ID_OPTIMISM]: 10,
  [CHAIN_ID_GNOSIS]: 100,
  [CHAIN_ID_ETHEREUM_ROPSTEN]: 3,
};

const getDetailsByChainId = (
  token: WormholeToken,
  chainId: ChainId,
): WormholeTokenDetails | null =>
  [token.nativeDetails, ...token.wrappedDetails].find(
    (details) => details.chainId === chainId,
  ) ?? null;

const useErc20BalanceQuery = ({
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

export const WormholeForm = (): ReactElement => {
  const wormholeTokens = rawWormholeTokens as readonly WormholeToken[];
  const [currentTokenSymbol, setCurrentTokenSymbol] = useState(
    wormholeTokens[0].symbol,
  );
  const currentToken = findOrThrow(
    wormholeTokens,
    (token) => token.symbol === currentTokenSymbol,
  );
  const tokenOptions: readonly EuiSelectOption[] = wormholeTokens.map(
    (token) => ({
      value: token.symbol,
      text: `${token.displayName} (${token.symbol})`,
      selected: token.symbol === currentTokenSymbol,
    }),
  );

  const sourceChains = useMemo(
    () => [
      currentToken.nativeDetails.chainId,
      ...currentToken.wrappedDetails.map(({ chainId }) => chainId),
    ],
    [currentToken],
  );
  const [sourceChainId, setSourceChainId] = useState(sourceChains[0]);
  const sourceChainOptions = sourceChains.map((chainId) => ({
    value: chainId,
    text: CHAIN_ID_TO_NAME[chainId],
    selected: chainId === sourceChainId,
  }));

  const targetChains = useMemo(
    () => sourceChains.filter((option) => option !== sourceChainId),
    [sourceChains, sourceChainId],
  );
  const [targetChainId, setTargetChainId] = useState(targetChains[0]);
  const targetChainOptions = targetChains.map((chainId) => ({
    value: chainId,
    text: CHAIN_ID_TO_NAME[chainId],
    selected: chainId === targetChainId,
  }));

  const [formInputAmount, setFormInputAmount] = useState("");
  const [inputAmount, setInputAmount] = useState(new Decimal(0));

  const [txResults, setTxResults] = useState<readonly TxResult[]>([]);

  const { mutateAsync: transfer, isLoading } = useWormholeTransfer();

  const sourceDetails = getDetailsByChainId(currentToken, sourceChainId);
  if (sourceDetails === null) {
    throw new Error("Missing source details");
  }
  const targetDetails = getDetailsByChainId(currentToken, targetChainId);
  const splBalance = useUserSolanaTokenBalance(
    sourceChainId === CHAIN_ID_SOLANA ? sourceDetails : null,
    { enabled: sourceChainId === CHAIN_ID_SOLANA },
  );
  const { data: erc20Balance = null } = useErc20BalanceQuery(sourceDetails);

  const handleTxResult = (txResult: TxResult): void => {
    setTxResults((previousResults) => [...previousResults, txResult]);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    (async (): Promise<void> => {
      if (targetDetails === null) {
        throw new Error("Missing target details");
      }
      setTxResults([]);
      await transfer({
        interactionId: generateId(),
        value: inputAmount,
        sourceDetails,
        targetDetails,
        nativeDetails: currentToken.nativeDetails,
        onTxResult: handleTxResult,
      });
    })().catch(console.error);
  };

  useEffect(() => {
    setSourceChainId(sourceChains[0]);
  }, [sourceChains]);

  useEffect(() => {
    if (targetChainId === sourceChainId) {
      setTargetChainId(targetChains[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetChains]);

  return (
    <EuiForm component="form" className="wormholeForm" onSubmit={handleSubmit}>
      {/* These tables are only to show what data is available */}
      <table>
        <tr>
          <th>{"Symbol"}</th>
          <td>{currentToken.symbol}</td>
        </tr>
        <tr>
          <th>{"Name"}</th>
          <td>{currentToken.displayName}</td>
        </tr>
        {currentToken.logo && (
          <tr>
            <th>{"Logo"}</th>
            <td>
              <img
                src={currentToken.logo}
                alt={currentToken.displayName}
                height="100px"
                width="100px"
              />
            </td>
          </tr>
        )}
        <tr>
          <th>{"Source Chain"}</th>
          <td>{sourceChainId}</td>
        </tr>
        <tr>
          <th>{"Balance"}</th>
          <td>{splBalance?.toString() ?? erc20Balance?.toString() ?? "-"}</td>
        </tr>
        <tr>
          <th>{"Target Chain"}</th>
          <td>{targetChainId}</td>
        </tr>
        <tr>
          <th>{"Loading?"}</th>
          <td>{isLoading.toString()}</td>
        </tr>
      </table>
      {txResults.length > 0 && (
        <>
          <h2>{"Tx results"}</h2>
          <table>
            <tr>
              <th>{"Chain ID"}</th>
              <th>{"Tx ID"}</th>
            </tr>
            {txResults.map(({ chainId, txId }) => (
              <tr key={txId}>
                <td>{chainId}</td>
                <td>{txId}</td>
              </tr>
            ))}
          </table>
        </>
      )}

      <EuiSpacer />

      <EuiFormRow fullWidth>
        <EuiSelect
          options={[...tokenOptions]}
          onChange={(event) => {
            setCurrentTokenSymbol(event.target.value);
          }}
        />
      </EuiFormRow>

      <EuiSpacer />

      <EuiFormRow fullWidth>
        <EuiSelect
          options={[...sourceChainOptions]}
          onChange={(event) => {
            const newSourceChainId = parseInt(
              event.target.value,
              10,
            ) as ChainId;
            setSourceChainId(newSourceChainId);
          }}
        />
      </EuiFormRow>

      <EuiSpacer />

      <EuiFormRow fullWidth>
        <EuiSelect
          options={[...targetChainOptions]}
          onChange={(event) => {
            const newTargetChainId = parseInt(
              event.target.value,
              10,
            ) as ChainId;
            setTargetChainId(newTargetChainId);
          }}
        />
      </EuiFormRow>

      <EuiSpacer />

      <EuiFormRow fullWidth>
        <EuiFieldIntlNumber
          placeholder="Amount"
          value={formInputAmount}
          min={0}
          onValueChange={setFormInputAmount}
          onBlur={() => {
            setInputAmount(new Decimal(formInputAmount));
          }}
        />
      </EuiFormRow>

      <EuiSpacer />

      <EuiFormRow fullWidth>
        <EuiButton type="submit" fullWidth fill isLoading={isLoading}>
          {"Transfer"}
        </EuiButton>
      </EuiFormRow>
    </EuiForm>
  );
};
