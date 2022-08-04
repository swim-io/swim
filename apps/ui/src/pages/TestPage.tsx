/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  CHAINS as WORMHOLE_CHAIN_IDS,
  approveEth,
  getForeignAssetEth,
} from "@certusone/wormhole-sdk";
import {
  EuiButton,
  EuiCheckbox,
  EuiFieldNumber,
  EuiFieldText,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiRadioGroup,
  EuiSpacer,
  EuiTitle,
} from "@elastic/eui";
import { PublicKey } from "@solana/web3.js";
import { sleep } from "@swim-io/utils";
import BN from "bn.js";
import type { ReactElement } from "react";
import { Fragment, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import { ConnectButton } from "../components/ConnectButton";
import type { EvmEcosystemId } from "../config";
import { EcosystemId, Protocol, getSolanaTokenDetails } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment, useNotification } from "../core/store";
import {
  useEvmConnections,
  usePool,
  useSolanaConnection,
  useTokensByEcosystem,
  useWallets,
} from "../hooks";
import { keysHexaPool, keysSwimLake } from "../keys";
import {
  SwimInitializer,
  setUpErc20Tokens,
  setUpSplTokensOnEvm,
} from "../models";

const SWIM_POOL_FEE_DECIMALS = 6;

const TestPage = (): ReactElement => {
  const { env } = useEnvironment();
  const {
    chains,
    tokens,
    wormhole: wormholeConfig,
  } = useEnvironment(selectConfig, shallow);
  const queryClient = useQueryClient();
  const [currentPool, setCurrentPool] = useState("hexapool");
  const secretKeys = currentPool === "swimlake" ? keysSwimLake : keysHexaPool;

  const {
    solana: { address: solanaAddress, wallet: solanaWallet },
    ethereum: { address: ethereumAddress, wallet: ethereumWallet },
    bnb: { address: bnbAddress, wallet: bnbWallet },
  } = useWallets();
  const evmConnections = useEvmConnections();
  const solanaConnection = useSolanaConnection();
  const {
    spec: poolSpec,
    state: poolState,
    lpToken,
    tokens: poolTokens,
  } = usePool(currentPool);

  if (poolSpec.ecosystem !== EcosystemId.Solana) {
    throw new Error("Test page is only for Solana Pool");
  }

  const [initTxIds, setInitTxIds] = useState<readonly string[] | null>(null);

  const poolTokenMintAddresses = useMemo(
    () => poolTokens.map((token) => getSolanaTokenDetails(token).address),
    [poolTokens],
  );
  const {
    solana: solanaTokens,
    ethereum: ethereumTokens,
    bnb: bnbTokens,
  } = useTokensByEcosystem();

  const nativeSolanaTokenAddresses = solanaTokens
    .filter((token) => token.nativeEcosystemId === EcosystemId.Solana)
    .filter((token) => !token.id.includes("-lp-"))
    .map((token) => getSolanaTokenDetails(token).address);
  const nativeEthereumTokenAddresses = ethereumTokens
    .filter((token) => token.nativeEcosystemId === EcosystemId.Ethereum)
    .filter((token) => !token.id.includes("-lp-"))
    .map((token) => token.nativeDetails.address);
  const nativeBnbTokenAddresses = bnbTokens
    .filter((token) => token.nativeEcosystemId === EcosystemId.Bnb)
    .filter((token) => !token.id.includes("-lp-"))
    .map((token) => token.nativeDetails.address);

  const lpTokenSolanaDetails = getSolanaTokenDetails(lpToken);

  const swimUsdToken = solanaTokens.find(
    (token) => token.id === "local-solana-lp-hexapool",
  )!;
  const xSwimToken = solanaTokens.find(
    (token) => token.id === "local-solana-lp-swimlake",
  )!;
  const swimUsdTokenSolanaDetails = getSolanaTokenDetails(swimUsdToken);
  const xSwimTokenSolanaDetails = getSolanaTokenDetails(xSwimToken);

  const solanaChain = chains[Protocol.Solana].find(Boolean)!;
  const ethereumChain = chains[Protocol.Evm].find(
    (chain) => chain.ecosystem === EcosystemId.Ethereum,
  )!;
  const bnbChain = chains[Protocol.Evm].find(
    (chain) => chain.ecosystem === EcosystemId.Bnb,
  )!;

  const [governanceAddress, setGovernanceAddress] = useState(
    "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
  );
  const poolTokenDecimals = poolTokens.map(
    (token) => getSolanaTokenDetails(token).decimals,
  );
  const [lpTokenDecimals, setLpTokenDecimals] = useState(
    Math.max(...poolTokenDecimals),
  );
  const [ampFactor, setAmpFactor] = useState(1000);
  const [ampFactorDecimals, setAmpFactorDecimals] = useState(0);
  const [lpFee, setLpFee] = useState(300); // 0.03% with 6 decimals
  const [governanceFee, setGovernanceFee] = useState(100); // 0.01% with 6 decimals
  const [useRandomInitKeys, setUseRandomInitKeys] = useState(true);

  const swimInitializer = useMemo(
    () =>
      solanaWallet
        ? new SwimInitializer(
            solanaConnection,
            solanaWallet,
            poolSpec.contract,
            poolTokenMintAddresses,
            governanceAddress,
          )
        : null,
    [
      solanaWallet,
      solanaConnection,
      poolSpec,
      poolTokenMintAddresses,
      governanceAddress,
    ],
  );

  const handleSetUpEvmTokens = async (
    ecosystem: EvmEcosystemId,
  ): Promise<void> => {
    if (!solanaWallet) {
      throw new Error("No Solana wallet");
    }
    const evmWallet =
      ecosystem === EcosystemId.Ethereum ? ethereumWallet : bnbWallet;
    if (!evmWallet) {
      throw new Error(`No ${ecosystem} wallet`);
    }

    const evmChain =
      ecosystem === EcosystemId.Ethereum ? ethereumChain : bnbChain;

    await evmWallet.switchNetwork(evmChain.chainId);

    const splTokenSetupResult = await setUpSplTokensOnEvm(
      wormholeConfig,
      solanaChain.wormhole,
      evmChain,
      solanaConnection,
      solanaWallet,
      evmWallet,
      nativeSolanaTokenAddresses,
    );
    console.info(`WRAPPED SOLANA TOKEN (${ecosystem}) SETUP`);
    console.info("SOLANA TX IDS", splTokenSetupResult.solanaTxIds);
    const splTokenSetupEvmTxIds =
      ecosystem === EcosystemId.Ethereum
        ? splTokenSetupResult.ethereumTxIds
        : splTokenSetupResult.bnbTxIds;
    console.info(`${ecosystem} TX IDS`, splTokenSetupEvmTxIds);

    const nativeErc20TokenAddresses =
      ecosystem === EcosystemId.Ethereum
        ? nativeEthereumTokenAddresses
        : nativeBnbTokenAddresses;
    const erc20TokenSetupResult = await setUpErc20Tokens(
      wormholeConfig,
      evmChain,
      solanaChain.wormhole,
      solanaConnection,
      solanaWallet,
      evmWallet,
      nativeErc20TokenAddresses,
    );
    console.info(`WRAPPED ${ecosystem} TOKEN (SOLANA) SETUP`);
    console.info("SOLANA TX IDS", erc20TokenSetupResult.solanaTxIds);
    const erc20TokenSetupEvmTxIds =
      ecosystem === EcosystemId.Ethereum
        ? erc20TokenSetupResult.ethereumTxIds
        : erc20TokenSetupResult.bnbTxIds;
    console.info(`${ecosystem} TX IDS`, erc20TokenSetupEvmTxIds);
  };

  const initPool = async (): Promise<void> => {
    const newInitTxIds =
      (await swimInitializer?.initialize(
        lpTokenDecimals,
        { value: new BN(ampFactor), decimals: ampFactorDecimals },
        { value: new BN(lpFee), decimals: SWIM_POOL_FEE_DECIMALS },
        { value: new BN(governanceFee), decimals: SWIM_POOL_FEE_DECIMALS },
        useRandomInitKeys ? undefined : Uint8Array.from(secretKeys.state),
        useRandomInitKeys ? undefined : Uint8Array.from(secretKeys.lpMint),
        useRandomInitKeys
          ? undefined
          : secretKeys.poolTokenAccounts.map((sk) => Uint8Array.from(sk)),
      )) ?? null;
    setInitTxIds(newInitTxIds);
    await sleep(1000);
    await queryClient.invalidateQueries(["poolState", env, poolSpec.address]);
  };

  const attestLpToken = async (): Promise<void> => {
    if (!solanaWallet) {
      throw new Error("No Solana wallet");
    }
    if (!ethereumWallet) {
      throw new Error("No Ethereum wallet");
    }
    if (!bnbWallet) {
      throw new Error("No BNB wallet");
    }

    const splTokenEthereumSetupResult = await setUpSplTokensOnEvm(
      wormholeConfig,
      solanaChain.wormhole,
      ethereumChain,
      solanaConnection,
      solanaWallet,
      ethereumWallet,
      [lpTokenSolanaDetails.address],
    );
    console.info("ATTEST LP TOKEN ON ETHEREUM");
    console.info("SOLANA TX IDS", splTokenEthereumSetupResult.solanaTxIds);
    console.info("ETHEREUM TX IDS", splTokenEthereumSetupResult.ethereumTxIds);

    const splTokenBnbSetupResult = await setUpSplTokensOnEvm(
      wormholeConfig,
      solanaChain.wormhole,
      bnbChain,
      solanaConnection,
      solanaWallet,
      bnbWallet,
      [lpTokenSolanaDetails.address],
    );
    console.info("ATTEST LP TOKEN ON BNB");
    console.info("SOLANA TX IDS", splTokenBnbSetupResult.solanaTxIds);
    console.info("BNB TX IDS", splTokenBnbSetupResult.bnbTxIds);
  };

  const { notify } = useNotification();
  const addToastHandler = (): void => {
    notify("Test", <div>My desc</div>);
  };

  const throwError = (): void => {
    throw new Error("Test error");
  };

  const approveErc20Bnb20 = async (): Promise<void> => {
    if (!ethereumWallet?.signer || !bnbWallet?.signer) {
      throw new Error("Connect Ethereum wallet and BNB wallet");
    }

    const hugeAmount = "1" + "0".repeat(32);

    await ethereumWallet.switchNetwork(ethereumChain.chainId);
    for (const token of tokens) {
      const ethereumDetails = token.wrappedDetails.get(EcosystemId.Ethereum);
      if (!ethereumDetails) {
        continue;
      }
      const receipt = await approveEth(
        ethereumChain.wormhole.tokenBridge,
        ethereumDetails.address,
        ethereumWallet.signer,
        hugeAmount,
      );
      console.info(receipt.transactionHash);
    }

    await bnbWallet.switchNetwork(bnbChain.chainId);
    for (const token of tokens) {
      const bnbDetails = token.wrappedDetails.get(EcosystemId.Bnb);
      if (!bnbDetails) {
        continue;
      }
      const receipt = await approveEth(
        bnbChain.wormhole.tokenBridge,
        bnbDetails.address,
        bnbWallet.signer,
        hugeAmount,
      );
      console.info(receipt.transactionHash);
    }
  };

  const unapproveErc20BNB20 = async (): Promise<void> => {
    if (!ethereumWallet?.signer || !bnbWallet?.signer) {
      throw new Error("Connect Ethereum wallet and BNB wallet");
    }

    const zero = "0";

    await ethereumWallet.switchNetwork(ethereumChain.chainId);
    for (const token of tokens) {
      const ethereumDetails = token.wrappedDetails.get(EcosystemId.Ethereum);
      if (!ethereumDetails) {
        continue;
      }
      const receipt = await approveEth(
        ethereumChain.wormhole.tokenBridge,
        ethereumDetails.address,
        ethereumWallet.signer,
        zero,
      );
      console.info(receipt.transactionHash);
    }

    await bnbWallet.switchNetwork(bnbChain.chainId);
    for (const token of tokens) {
      const bnbDetails = token.wrappedDetails.get(EcosystemId.Bnb);
      if (!bnbDetails) {
        continue;
      }
      const receipt = await approveEth(
        bnbChain.wormhole.tokenBridge,
        bnbDetails.address,
        bnbWallet.signer,
        zero,
      );
      console.info(receipt.transactionHash);
    }
  };

  const getWrappedTokensEth = async (): Promise<void> => {
    console.info("WRAPPED SPL TOKENS ON ETHEREUM");
    for (const token of [
      ...nativeSolanaTokenAddresses,
      swimUsdTokenSolanaDetails.address,
      xSwimTokenSolanaDetails.address,
    ]) {
      const wormholeAsset = new PublicKey(token).toBytes();
      const foreignAsset = await getForeignAssetEth(
        ethereumChain.wormhole.tokenBridge,
        evmConnections[EcosystemId.Ethereum].provider,
        WORMHOLE_CHAIN_IDS.solana,
        wormholeAsset,
      );
      console.info(`${token}: ${String(foreignAsset)}`);
    }
  };
  const getWrappedTokensBNB = async (): Promise<void> => {
    console.info("WRAPPED SPL TOKENS ON BNB");
    for (const token of [
      ...nativeSolanaTokenAddresses,
      swimUsdTokenSolanaDetails.address,
      xSwimTokenSolanaDetails.address,
    ]) {
      const wormholeAsset = new PublicKey(token).toBytes();
      const foreignAsset = await getForeignAssetEth(
        bnbChain.wormhole.tokenBridge,
        evmConnections[EcosystemId.Bnb].provider,
        WORMHOLE_CHAIN_IDS.solana,
        wormholeAsset,
      );
      console.info(`${token}: ${String(foreignAsset)}`);
    }
  };

  return (
    <EuiPage restrictWidth>
      <EuiPageBody>
        <EuiPageHeader>
          <EuiPageHeaderSection>
            <EuiTitle size="l">
              <h1>Test Page</h1>
            </EuiTitle>
          </EuiPageHeaderSection>
        </EuiPageHeader>

        <EuiPageContent>
          <EuiPageContentBody>
            <ConnectButton ecosystemId={EcosystemId.Solana} />
            &nbsp;
            <ConnectButton ecosystemId={EcosystemId.Ethereum} />
            &nbsp;
            <ConnectButton ecosystemId={EcosystemId.Bnb} />
            &nbsp;
            <EuiButton onClick={addToastHandler}>Notify</EuiButton>
            &nbsp;
            <EuiButton onClick={throwError}>Throw error</EuiButton>
            &nbsp;
            <EuiButton
              onClick={() => {
                approveErc20Bnb20().catch(console.error);
              }}
            >
              Approve ERC20/BNB20
            </EuiButton>
            &nbsp;
            <EuiButton
              onClick={() => {
                unapproveErc20BNB20().catch(console.error);
              }}
            >
              Unapprove ERC20/BNB20
            </EuiButton>
            <EuiSpacer />
            <h2>Current pool:</h2>
            <EuiRadioGroup
              name="selectPool"
              options={["hexapool", "swimlake"].map((id) => ({
                id,
                label: id,
              }))}
              idSelected={currentPool}
              onChange={setCurrentPool}
            />
            <EuiSpacer />
            <EuiButton
              isDisabled={!solanaAddress || !ethereumAddress}
              onClick={() => {
                handleSetUpEvmTokens(EcosystemId.Ethereum).catch(console.error);
              }}
            >
              Set up Wormhole tokens (Ethereum)
            </EuiButton>
            <EuiButton
              isDisabled={!solanaAddress || !bnbAddress}
              onClick={() => {
                handleSetUpEvmTokens(EcosystemId.Bnb).catch(console.error);
              }}
            >
              Set up Wormhole tokens (BNB)
            </EuiButton>
            <EuiSpacer />
            <h2>Pool initializer</h2>
            <table>
              <tbody>
                <tr>
                  <th>Program ID</th>
                  <td>{swimInitializer?.programId.toBase58()}</td>
                </tr>
                <tr>
                  <th>State key</th>
                  <td>{swimInitializer?.stateAccount?.toBase58()}</td>
                </tr>
                <tr>
                  <th>Authority key</th>
                  <td>{swimInitializer?.poolAuthority?.toBase58()}</td>
                </tr>
                <tr>
                  <th>Nonce</th>
                  <td>{swimInitializer?.nonce}</td>
                </tr>
                <tr>
                  <th>LP mint</th>
                  <td>{swimInitializer?.lpMint?.toBase58()}</td>
                </tr>
                <tr>
                  <th>Tx Ids</th>
                  <td>{initTxIds?.join(", ")}</td>
                </tr>
              </tbody>
            </table>
            <span>
              Governance Address (for testing just use your own wallet address):
            </span>
            <EuiFieldText
              name="governanceAddress"
              placeholder="Governance address"
              value={governanceAddress}
              onChange={(e) => setGovernanceAddress(e.target.value)}
            />
            <span>LP Token Decimals (should be max of all pool tokens):</span>
            <EuiFieldNumber
              name="lpTokenDecimals"
              placeholder="LP token decimals"
              step={1}
              value={lpTokenDecimals}
              onChange={(e) => setLpTokenDecimals(parseInt(e.target.value, 10))}
            />
            <span>Amp Factor:</span>
            <EuiFieldNumber
              name="ampFactor"
              placeholder="Amp factor"
              step={1}
              value={ampFactor}
              onChange={(e) => setAmpFactor(parseInt(e.target.value, 10))}
            />
            <span>Amp Factor Decimals:</span>
            <EuiFieldNumber
              name="ampFactorDecimals"
              placeholder="Amp factor decimals"
              step={1}
              value={ampFactorDecimals}
              onChange={(e) =>
                setAmpFactorDecimals(parseInt(e.target.value, 10))
              }
            />
            <span>LP Fee (</span>
            {SWIM_POOL_FEE_DECIMALS}
            <span>&nbsp;decimals):</span>
            <EuiFieldNumber
              name="lpFee"
              placeholder="LP fee"
              step={1}
              value={lpFee}
              onChange={(e) => setLpFee(parseInt(e.target.value, 10))}
            />
            <span>Governance Fee (</span>
            {SWIM_POOL_FEE_DECIMALS}
            <span>&nbsp;decimals):</span>
            <EuiFieldNumber
              name="governanceFee"
              placeholder="Governance fee"
              step={1}
              value={governanceFee}
              onChange={(e) => setGovernanceFee(parseInt(e.target.value, 10))}
            />
            <EuiCheckbox
              id="randomInitKeys"
              label="Use random init keys?"
              checked={useRandomInitKeys}
              onChange={(e) => {
                setUseRandomInitKeys(e.target.checked);
              }}
            />
            <EuiSpacer />
            <EuiButton
              onClick={() => {
                initPool().catch(console.error);
              }}
              isDisabled={
                solanaAddress === null || (!useRandomInitKeys && !!poolState)
              }
            >
              Init pool
            </EuiButton>
            <EuiButton
              onClick={() => {
                attestLpToken().catch(console.error);
              }}
              isDisabled={!poolState}
            >
              Attest LP token
            </EuiButton>
            <EuiSpacer />
            {poolState && (
              <>
                <h2>Pool state</h2>
                <table>
                  <tbody>
                    <tr>
                      <th>Nonce</th>
                      <td>{poolState.nonce}</td>
                    </tr>
                    <tr>
                      <th>Is paused?</th>
                      <td>{poolState.isPaused.toString()}</td>
                    </tr>
                    <tr>
                      <th>Governance key</th>
                      <td>{poolState.governanceKey.toBase58()}</td>
                    </tr>
                    <tr>
                      <th>Prepared governance key</th>
                      <td>{poolState.preparedGovernanceKey.toBase58()}</td>
                    </tr>
                    <tr>
                      <th>Governance fee key</th>
                      <td>{poolState.governanceFeeKey.toBase58()}</td>
                    </tr>
                    <tr>
                      <th>LP mint</th>
                      <td>{poolState.lpMintKey.toBase58()}</td>
                    </tr>
                    {poolState.tokenMintKeys.map((mint, i) => (
                      <tr key={mint.toBase58()}>
                        <th>Mint {i}</th>
                        <td>{mint.toBase58()}</td>
                      </tr>
                    ))}
                    {poolState.tokenKeys.map((account, i) => (
                      <tr key={account.toBase58()}>
                        <th>Account {i}</th>
                        <td>{account.toBase58()}</td>
                      </tr>
                    ))}
                    <tr>
                      <th>Amp factor initial value</th>
                      <td>
                        {poolState.ampFactor.initialValue.value.toString()}e-
                        {poolState.ampFactor.initialValue.decimals}
                      </td>
                    </tr>
                    <tr>
                      <th>Amp factor initial timestamp</th>
                      <td>{poolState.ampFactor.initialTs.toString()}</td>
                    </tr>
                    <tr>
                      <th>Amp factor target value</th>
                      <td>
                        {poolState.ampFactor.targetValue.value.toString()}e-
                        {poolState.ampFactor.targetValue.decimals}
                      </td>
                    </tr>
                    <tr>
                      <th>Amp factor target timestamp</th>
                      <td>{poolState.ampFactor.targetTs.toString()}</td>
                    </tr>
                    <tr>
                      <th>LP fee</th>
                      <td>
                        {poolState.lpFee}e-{poolSpec.feeDecimals}
                      </td>
                    </tr>
                    <tr>
                      <th>Prepared LP fee</th>
                      <td>
                        {poolState.preparedLpFee}e-{poolSpec.feeDecimals}
                      </td>
                    </tr>
                    <tr>
                      <th>Governance fee</th>
                      <td>
                        {poolState.governanceFee}e-{poolSpec.feeDecimals}
                      </td>
                    </tr>
                    <tr>
                      <th>Prepared governance fee</th>
                      <td>
                        {poolState.preparedGovernanceFee}e-
                        {poolSpec.feeDecimals}
                      </td>
                    </tr>
                    <tr>
                      <th>Governance transition timestamp</th>
                      <td>{poolState.governanceTransitionTs.toString()}</td>
                    </tr>
                    <tr>
                      <th>Fee transition timestamp</th>
                      <td>{poolState.feeTransitionTs.toString()}</td>
                    </tr>
                    <tr>
                      <th>Previous depth</th>
                      <td>{poolState.previousDepth.toString()}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
            <EuiSpacer />
            <h2>Solana token addresses</h2>
            <code>
              {[
                ...nativeSolanaTokenAddresses,
                swimUsdTokenSolanaDetails.address,
                xSwimTokenSolanaDetails.address,
              ].map((address) => (
                <Fragment key={address}>
                  {address}
                  <br />
                </Fragment>
              ))}
            </code>
            <EuiButton
              onClick={() => {
                getWrappedTokensEth().catch(console.error);
              }}
            >
              Get wrapped tokens (Ethereum)
            </EuiButton>
            <EuiButton
              onClick={() => {
                getWrappedTokensBNB().catch(console.error);
              }}
            >
              Get wrapped tokens (BNB)
            </EuiButton>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default TestPage;
