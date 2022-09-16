import type { EuiSuperSelectOption } from "@elastic/eui";
import {
  EuiButton,
  EuiButtonIcon,
  EuiCallOut,
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiLink,
  EuiSelect,
  EuiSpacer,
  EuiSuperSelect,
  EuiText,
  EuiTextColor,
  EuiTitle,
} from "@elastic/eui";
import { ReadonlyRecord } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import shallow from "zustand/shallow.js";

import { displayAmount } from "../amounts";
import {  TokenConfig } from "../config";
import { EcosystemId, ECOSYSTEMS } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment, useNotification } from "../core/store";
import {
  useChainsByEcosystem,
  useUserBalances,
  useWallets,
  useWormhole,
} from "../hooks";

import { ConfirmModal } from "./ConfirmModal";
import { ConnectButton } from "./ConnectButton";
import { TokenConfigIcon } from "./TokenIcon";

const generateTokenOptions = (
  tokens: readonly TokenConfig[],
): readonly EuiSuperSelectOption<string>[] =>
  tokens.map((tokenSpec) => ({
    value: tokenSpec.id,
    inputDisplay: (
      <TokenConfigIcon
        token={tokenSpec}
        ecosystem={tokenSpec.nativeEcosystemId}
      />
    ),
    dropdownDisplay: (
      <>
        <TokenConfigIcon
          token={tokenSpec}
          ecosystem={tokenSpec.nativeEcosystemId}
        />
        <EuiText size="s" color="subdued">
          <p className="euiTextColor--subdued">
            {tokenSpec.nativeDetails} (
            {ECOSYSTEMS[tokenSpec.nativeEcosystemId].displayName})
          </p>
        </EuiText>
      </>
    ),
  }));

const useNonSolanaEcosystemChangeEffect = (
  nonSolanaEcosystem: EcosystemId,
): void => {
  const {
    ethereum: { wallet: ethereumWallet },
  } = useWallets();
  const { ethereum: ethereumChain } = useChainsByEcosystem();
  const ref = useRef(nonSolanaEcosystem);

  useEffect((): void => {
    if (nonSolanaEcosystem === ref.current) {
      return;
    }
    // eslint-disable-next-line functional/immutable-data
    ref.current = nonSolanaEcosystem;
    switch (nonSolanaEcosystem) {
      case ECOSYSTEMS.ethereum.id:
        if (ethereumWallet && ethereumChain) {
          void ethereumWallet.switchNetwork(1);
        }
        return;
      // case ECOSYSTEMS.bnb.id:
      //   if (bscWallet && bscChain) {
      //     void bscWallet.switchNetwork();
      //   }
      //   return;
      default:
        return;
    }
  }, [ethereumChain, ethereumWallet, nonSolanaEcosystem]);
};

export const WormholeForm = (): ReactElement => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const { notify } = useNotification();
  const {
    solana: { address: solanaAddress },
    ethereum: { address: ethereumAddress },
    bnb: { address: bscAddress },
    avalanche: { address: avalancheAddress },
    polygon: { address: polygonAddress },
  } = useWallets();
  const {
    tokenId,
    setTokenId,
    fromEcosystem,
    setFromEcosystem,
    toEcosystem,
    setToEcosystem,
    tokenSpec,
    fromTokenDetails,
    toTokenDetails,
    transferAmount,
    setTransferAmount,
    executeTransfer,
    transferError,
  } = useWormhole();
  const userBalances = useUserBalances(tokenSpec);

  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [txInProgress, setTxInProgress] = useState(false);
  const [amountErrors, setAmountErrors] = useState<readonly string[]>([]);

  const userAddresses: ReadonlyRecord<EcosystemId, string | null> = {
    [ECOSYSTEMS.solana.id]: solanaAddress,
    [ECOSYSTEMS.ethereum.id]: ethereumAddress,
    [ECOSYSTEMS.bnb.id]: bscAddress,
    [ECOSYSTEMS.avalanche.id]: avalancheAddress,
    [ECOSYSTEMS.polygon.id]: polygonAddress,
    [ECOSYSTEMS.aurora.id]: null,
    [ECOSYSTEMS.fantom.id]: null,
    [ECOSYSTEMS.karura.id]: null,
    [ECOSYSTEMS.acala.id]: null,
  };
  const fromAddress = userAddresses[fromEcosystem];
  const toAddress = userAddresses[toEcosystem];

  const fromTokenBalance = userBalances[fromEcosystem];
  const toTokenBalance = userBalances[toEcosystem];

  const relevantTokens = tokens.filter(({ nativeEcosystemId }) =>
    [fromEcosystem, toEcosystem].includes(nativeEcosystemId),
  );
  const tokenOptions = generateTokenOptions(relevantTokens);

  const nonSolanaEcosystem =
    fromEcosystem === ECOSYSTEMS.solana.id ? toEcosystem : fromEcosystem;
  const nonSolanaEcosystemOptions = [
    {
      value: ECOSYSTEMS.ethereum.id,
      text: ECOSYSTEMS[ECOSYSTEMS.ethereum.id].displayName,
    },
    {
      value: ECOSYSTEMS.bnb.id,
      text: ECOSYSTEMS[ECOSYSTEMS.bnb.id].displayName,
    },
  ];

  useNonSolanaEcosystemChangeEffect(nonSolanaEcosystem);

  const handleNonSolanaEcosystemChange = (
    e: ChangeEvent<HTMLSelectElement>,
  ): void => {
    const ecosystemId = e.target.value as EcosystemId;
    return fromEcosystem === ECOSYSTEMS.solana.id
      ? setToEcosystem(ecosystemId)
      : setFromEcosystem(ecosystemId);
  };

  const toggleDirection = (): void => {
    setFromEcosystem(toEcosystem);
    setToEcosystem(fromEcosystem);
  };

  const handleChangeTransferAmount = (
    e: ChangeEvent<HTMLInputElement>,
  ): void => {
    setTransferAmount(e.target.value);
  };

  const handleBlurTransferAmount = (): void => {
    try {
      const transferAmountDecimal = new Decimal(transferAmount);
      if (transferAmountDecimal.lte(0)) {
        setAmountErrors(["Amount must be greater than zero"]);
      } else if (transferAmountDecimal.gt(new Decimal(fromTokenBalance ?? 0))) {
        setAmountErrors(["Amount cannot exceed available balance"]);
      } else {
        setAmountErrors([]);
      }
    } catch {
      setAmountErrors(["Invalid amount"]);
    }
  };

  const submitForm = async (): Promise<void> => {
    notify("Transaction submitted", "Loading...", "info");
    try {
      await executeTransfer();
    } catch (error) {
      notify("Error", String(error), "error");
    }
    setTxInProgress(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setTxInProgress(true);

    if (!transferAmount) {
      setTxInProgress(false);
      return;
    }

    if (tokenSpec.isStablecoin && new Decimal(transferAmount).gte(10_000)) {
      setIsConfirmModalVisible(true);
      return;
    }

    await submitForm();
  };

  const handleConfirmModalCancel = (): void => {
    setIsConfirmModalVisible(false);
    setTxInProgress(false);
  };

  const handleConfirmModalConfirm = async (): Promise<void> => {
    setIsConfirmModalVisible(false);
    await submitForm();
  };

  return (
    <EuiForm
      className="wormholeForm"
      component="form"
      style={{ maxWidth: 400 }}
      onSubmit={handleSubmit}
    >
      <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle>
            <h2>Wormhole</h2>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem>Non-Solana blockchain:</EuiFlexItem>
        <EuiFlexItem grow={4}>
          <EuiSelect
            id="ethereum-bsc"
            options={nonSolanaEcosystemOptions}
            value={nonSolanaEcosystem}
            onChange={handleNonSolanaEcosystemChange}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiFlexGroup gutterSize="xs">
        <EuiFlexItem grow={4}>
          {/* <ConnectButton ecosystemId={fromEcosystem}>
            {fromAddress && (fromAddress)}
          </ConnectButton> */}
          {fromAddress}
        </EuiFlexItem>
        <EuiFlexItem grow={2}>
          <div style={{ textAlign: "center", margin: "auto" }}>
            <EuiButtonIcon
              iconType="sortRight"
              size="m"
              onClick={toggleDirection}
              className="eui-hideFor--xs eui-hideFor--s"
              aria-label="Toggle direction"
            />
            <EuiButtonIcon
              iconType="sortDown"
              size="m"
              onClick={toggleDirection}
              className="eui-showFor--xs eui-showFor--s"
              aria-label="Toggle direction"
            />
          </div>
        </EuiFlexItem>
        <EuiFlexItem grow={4}>
          {/* <ConnectButton ecosystemId={toEcosystem}>
            {toAddress && (toAddress)}
          </ConnectButton> */}
          {toAddress}
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow hasEmptyLabelSpace>
            <EuiSuperSelect
              name="tokenId"
              options={[...tokenOptions]}
              valueOfSelected={tokenId}
              onChange={setTokenId}
              itemLayoutAlign="top"
              hasDividers
              disabled={!fromAddress}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            labelAppend={
              <EuiText size="xs">
                <span>Max:</span>{" "}
                <span>
                  {fromTokenBalance
                    ? displayAmount(
                        fromTokenBalance.toFixed(0),
                        fromTokenDetails.decimals,
                      )
                    : "-"}
                </span>
              </EuiText>
            }
            isInvalid={amountErrors.length > 0}
            error={amountErrors}
          >
            <EuiFieldNumber
              name="amount"
              placeholder="Amount"
              min={0}
              step={10 ** -fromTokenDetails.decimals}
              value={transferAmount}
              onChange={handleChangeTransferAmount}
              onBlur={handleBlurTransferAmount}
              isInvalid={amountErrors.length > 0}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiTextColor color="default">
        <span>You will receive&nbsp;</span>
        {tokenSpec.symbol}
        <span>. (Balance:</span>{" "}
        <span>
          {toTokenBalance
            ? displayAmount(toTokenBalance.toFixed(0), toTokenDetails.decimals)
            : "-"}
        </span>
        <span>)</span>
      </EuiTextColor>
      <EuiSpacer size="m" />
      {transferError !== null && (
        <>
          <EuiCallOut title="Something went wrong" color="danger">
            {transferError.message}
            <EuiSpacer />
            <span>
              If your transfer was interrupted, check the relevant blockchain
              explorer for the transaction ID and use
            </span>{" "}
            <EuiLink href="https://wormholebridge.com/#/redeem" target="_blank">
              this form
            </EuiLink>{" "}
            <span>to complete the transfer.</span>
          </EuiCallOut>
          <EuiSpacer />
        </>
      )}
      <EuiButton
        type="submit"
        fullWidth
        isDisabled={txInProgress || !fromAddress || amountErrors.length > 0}
      >
        {txInProgress ? "Loading..." : "Transfer"}
      </EuiButton>
      <ConfirmModal
        isVisible={isConfirmModalVisible}
        onCancel={handleConfirmModalCancel}
        onConfirm={handleConfirmModalConfirm}
        titleText="Confirm Transfer"
        cancelText="Cancel"
        confirmText="Transfer"
        promptText={`Are you sure you want to transfer ${transferAmount} ${tokenSpec.symbol}?`}
      />
    </EuiForm>
  );
};
