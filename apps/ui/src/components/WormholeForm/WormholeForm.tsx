import { EuiIcon, EuiSuperSelectOption } from "@elastic/eui";
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
import { useFromTokenOptionsIds } from "hooks/swim/useSwapTokenOptions";
import { ChangeEvent, FormEvent, ReactElement, useMemo } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { displayAmount } from "../../amounts";
import { ECOSYSTEM_LIST, TokenConfig } from "../../config";
import { EcosystemId, ECOSYSTEMS } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useNotification } from "../../core/store";
// import {
//   useChainsByEcosystem,
//   useUserBalances,
//   useWallets,
//   useWormhole,
// } from "../hooks";

import { ConfirmModal } from "../ConfirmModal";
import { ConnectButton, MultiConnectButton } from "../ConnectButton";
import { TokenConfigIcon } from "../TokenIcon";
import { WormholeTokenInput } from "./WormholeTokenInput";

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

// const useNonSolanaEcosystemChangeEffect = (
//   nonSolanaEcosystem: EcosystemId,
// ): void => {
//   const {
//     ethereum: { wallet: ethereumWallet },
//   } = useWallets();
//   const { ethereum: ethereumChain } = useChainsByEcosystem();
//   const ref = useRef(nonSolanaEcosystem);

//   useEffect((): void => {
//     if (nonSolanaEcosystem === ref.current) {
//       return;
//     }
//     // eslint-disable-next-line functional/immutable-data
//     ref.current = nonSolanaEcosystem;
//     switch (nonSolanaEcosystem) {
//       case ECOSYSTEMS.ethereum.id:
//         if (ethereumWallet && ethereumChain) {
//           void ethereumWallet.switchNetwork(1);
//         }
//         return;
//       // case ECOSYSTEMS.bnb.id:
//       //   if (bscWallet && bscChain) {
//       //     void bscWallet.switchNetwork();
//       //   }
//       //   return;
//       default:
//         return;
//     }
//   }, [ethereumChain, ethereumWallet, nonSolanaEcosystem]);
// };

export const WormholeForm = (): ReactElement => {
  const { tokens, ecosystems } = useEnvironment(selectConfig, shallow);
  const { notify } = useNotification();
  const { t } = useTranslation();

  const fromTokenOptionsIds = useFromTokenOptionsIds();
  const [formInputAmount, setFormInputAmount] = useState("");

  const [fromToken, setFromToken] = useState(tokens[0]);
  const [fromEcosystemId, setFromEcosystemId] = useState(ecosystems.solana.id);
  const [toEcosystemId, setToEcosystemId] = useState(ecosystems.solana.id);
  const [tokenAddress, setTokenAddress] = useState("");
  // const {
  //   solana: { address: solanaAddress },
  //   ethereum: { address: ethereumAddress },
  //   bnb: { address: bscAddress },
  //   avalanche: { address: avalancheAddress },
  //   polygon: { address: polygonAddress },
  // } = useWallets();
  // const {
  //   tokenId,
  //   setTokenId,
  //   fromEcosystem,
  //   setFromEcosystem,
  //   toEcosystem,
  //   setToEcosystem,
  //   tokenSpec,
  //   fromTokenDetails,
  //   toTokenDetails,
  //   transferAmount,
  //   setTransferAmount,
  //   executeTransfer,
  //   transferError,
  // } = useWormhole();
  // const userBalances = useUserBalances(tokenSpec);

  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [txInProgress, setTxInProgress] = useState(false);
  const [amountErrors, setAmountErrors] = useState<readonly string[]>([]);

  const selectEcosystemOptions = useMemo(() => {
    return [
      { inputDisplay: t("pools_page.all_chains"), value: "all", icon: null },
      ...ECOSYSTEM_LIST.map((ecosystem) => ({
        value: ecosystem.id,
        inputDisplay: (
          <EuiFlexGroup
            gutterSize="none"
            alignItems="center"
            responsive={false}
          >
            <EuiFlexItem grow={false} style={{ marginRight: 20 }}>
              <EuiIcon
                type={ecosystem.logo}
                size="m"
                title={ecosystem.displayName}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText>{ecosystem.displayName}</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
        icon: null,
      })),
    ];
  }, [ECOSYSTEM_LIST, t]);

  // const userAddresses: ReadonlyRecord<EcosystemId, string | null> = {
  //   [ECOSYSTEMS.solana.id]: solanaAddress,
  //   [ECOSYSTEMS.ethereum.id]: ethereumAddress,
  //   [ECOSYSTEMS.bnb.id]: bscAddress,
  //   [ECOSYSTEMS.avalanche.id]: avalancheAddress,
  //   [ECOSYSTEMS.polygon.id]: polygonAddress,
  //   [ECOSYSTEMS.aurora.id]: null,
  //   [ECOSYSTEMS.fantom.id]: null,
  //   [ECOSYSTEMS.karura.id]: null,
  //   [ECOSYSTEMS.acala.id]: null,
  // };
  // const fromAddress = userAddresses[fromEcosystem];
  // const toAddress = userAddresses[toEcosystem];

  // const fromTokenBalance = userBalances[fromEcosystem];
  // const toTokenBalance = userBalances[toEcosystem];

  // const relevantTokens = tokens.filter(({ nativeEcosystemId }) =>
  //   [fromEcosystem, toEcosystem].includes(nativeEcosystemId),
  // );
  // const tokenOptions = generateTokenOptions(relevantTokens);

  // const nonSolanaEcosystem =
  //   fromEcosystem === ECOSYSTEMS.solana.id ? toEcosystem : fromEcosystem;
  // const nonSolanaEcosystemOptions = [
  //   {
  //     value: ECOSYSTEMS.ethereum.id,
  //     text: ECOSYSTEMS[ECOSYSTEMS.ethereum.id].displayName,
  //   },
  //   {
  //     value: ECOSYSTEMS.bnb.id,
  //     text: ECOSYSTEMS[ECOSYSTEMS.bnb.id].displayName,
  //   },
  // ];

  // useNonSolanaEcosystemChangeEffect(nonSolanaEcosystem);

  const handleNonSolanaEcosystemChange = (
    e: ChangeEvent<HTMLSelectElement>,
  ): void => {
    const ecosystemId = e.target.value as EcosystemId;
    // return fromEcosystem === ECOSYSTEMS.solana.id
    //   ? setToEcosystem(ecosystemId)
    //   : setFromEcosystem(ecosystemId);
  };

  // const toggleDirection = (): void => {
  //   setFromEcosystem(toEcosystem);
  //   setToEcosystem(fromEcosystem);
  // };

  // const handleChangeTransferAmount = (
  //   e: ChangeEvent<HTMLInputElement>,
  // ): void => {
  //   setTransferAmount(e.target.value);
  // };

  const handleBlurTransferAmount = (): void => {
    try {
      // const transferAmountDecimal = new Decimal(transferAmount);
      const transferAmountDecimal = new Decimal(1);
      if (transferAmountDecimal.lte(0)) {
        setAmountErrors(["Amount must be greater than zero"]);
        // } else if (transferAmountDecimal.gt(new Decimal(fromTokenBalance ?? 0))) {
        // setAmountErrors(["Amount cannot exceed available balance"]);
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
      // await executeTransfer();
    } catch (error) {
      notify("Error", String(error), "error");
    }
    setTxInProgress(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setTxInProgress(true);

    // if (!transferAmount) {
    //   setTxInProgress(false);
    //   return;
    // }

    // if (tokenSpec.isStablecoin && new Decimal(transferAmount).gte(10_000)) {
    //   setIsConfirmModalVisible(true);
    //   return;
    // }

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
    <EuiForm className="wormholeForm" component="form" onSubmit={handleSubmit}>
      <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle>
            <h2>Wormhole</h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false} className="buttons">
          <MultiConnectButton size="s" fullWidth />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <WormholeTokenInput
        value={formInputAmount}
        token={fromToken}
        tokenOptionIds={fromTokenOptionsIds}
        tokenAddress={tokenAddress}
        ecosystemId={fromEcosystemId}
        placeholder={"0.00"}
        errors={[]}
        onSelectToken={setFromToken}
        onChangeValue={setFormInputAmount}
        onChangeTokenAddress={setTokenAddress}
        onSelectEcosystem={setFromEcosystemId}
      />
      <EuiSpacer />
      <EuiFormRow labelType="legend" label={<span>Target</span>} fullWidth>
        <EuiSuperSelect
          options={selectEcosystemOptions}
          valueOfSelected={toEcosystemId}
          onChange={(value) => setToEcosystemId(value as EcosystemId)}
          hasDividers
          fullWidth
          style={{ textAlign: "center" }}
        />
      </EuiFormRow>
      <EuiSpacer size="xl" />
      <EuiTextColor color="default">
        <span>You will receive&nbsp;</span>
        {/* {tokenSpec.symbol} */}
        <span>. (Balance: )</span>{" "}
        {/* <span>
          {toTokenBalance
            ? displayAmount(toTokenBalance.toFixed(0), toTokenDetails.decimals)
            : "-"}
        </span>
        <span>)</span> */}
      </EuiTextColor>
      <EuiSpacer size="m" />
      {/* {transferError !== null && (
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
      )} */}
      <EuiButton
        type="submit"
        fullWidth
        isDisabled={txInProgress || amountErrors.length > 0}
      >
        {txInProgress ? "Loading..." : "Wormhole"}
      </EuiButton>
      <ConfirmModal
        isVisible={isConfirmModalVisible}
        onCancel={handleConfirmModalCancel}
        onConfirm={handleConfirmModalConfirm}
        titleText="Confirm Transfer"
        cancelText="Cancel"
        confirmText="Transfer"
        promptText={`Are you sure you want to transfer`}
      />
    </EuiForm>
  );
};
