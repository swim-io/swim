import type { ChainId } from "@certusone/wormhole-sdk";
import { CHAIN_ID_TO_NAME } from "@certusone/wormhole-sdk";
import type { EuiSelectOption } from "@elastic/eui";
import {
  EuiButton,
  EuiForm,
  EuiFormRow,
  EuiSelect,
  EuiSpacer,
} from "@elastic/eui";
import { findOrThrow } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { wormholeTokens as rawWormholeTokens } from "../config";
import { useWormholeTransfer } from "../hooks";
import type { TxResult, WormholeToken, WormholeTokenDetails } from "../models";
import { generateId } from "../models";

import { EuiFieldIntlNumber } from "./EuiFieldIntlNumber";

const getDetailsByChainId = (
  token: WormholeToken,
  chainId: ChainId,
): WormholeTokenDetails =>
  findOrThrow(
    [token.nativeDetails, ...token.wrappedDetails],
    (details) => details.chainId === chainId,
  );

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

  const handleTxResult = (txResult: TxResult): void => {
    setTxResults((previousResults) => [...previousResults, txResult]);
  };

  const handleSubmit = () => {
    (async (): Promise<void> => {
      setTxResults([]);
      const sourceDetails = getDetailsByChainId(currentToken, sourceChainId);
      const targetDetails = getDetailsByChainId(currentToken, targetChainId);
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
