import Decimal from "decimal.js";
import type { BigNumber, ethers } from "ethers";
import { utils as ethersUtils } from "ethers";

/**
 * The Wormhole EVM token bridge contract does not offer memo logging, meaning we would need a separate smart contract to implement that. However, because the token bridge contract relies on msg.sender we cannot simply log and forward the call data, meaning we would essentially have to rewrite the whole contract ourselves. Thus we store the ID at the end of the call data where it has no effect on the smart contract functionality and can be retrieved later.
 */
export const appendHexDataToEvmTx = (
  hexData: string,
  populatedTx: ethers.PopulatedTransaction,
): ethers.PopulatedTransaction => ({
  ...populatedTx,
  data: populatedTx.data ? `${populatedTx.data}${hexData}` : `0x${hexData}`,
});

export interface DecimalStructOutput {
  readonly value: BigNumber;
  readonly decimals: number;
}

export const bigNumberToHumanDecimal = (
  value: BigNumber,
  decimals: number,
): Decimal => new Decimal(ethersUtils.formatUnits(value, decimals));

export const decimalStructOutputToDecimal = ({
  value,
  decimals,
}: DecimalStructOutput): Decimal => bigNumberToHumanDecimal(value, decimals);
