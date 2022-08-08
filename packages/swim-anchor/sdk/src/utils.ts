import { TwoPool } from "./artifacts/two_pool";
import TwoPoolIDL from "./artifacts/two_pool.json";
import fs from "fs";
import { Program, web3 } from "@project-serum/anchor";

export const twoPoolToString = async (
  program: Program<TwoPool>,
  twoPoolKey: web3.PublicKey
): Promise<string> => {
  let twoPool = (await program.account.twoPool.fetch(twoPoolKey));
  let twoPoolFixed =
    {
      key: twoPoolKey.toString(),
      ...twoPool,
      ampFactor: formatAmpFactor(twoPool.ampFactor),
      previousDepth: twoPool.previousDepth.toString(),
  };

  return JSON.stringify(twoPoolFixed, null, 2);
}
export const twoPoolReplacer = (key: string, value: any) => {
  if (key === "ampFactor") {
    return formatAmpFactor(value);
  }
  else if (key === "previousDepth") {
    return value.toString();
  }
  return value;
}

export const formatAmpFactor = (ampFactor: any) => {
  return {
    initialValue: {
      value: ampFactor.initialValue.value.toString(),
      decimals: ampFactor.initialValue.decimals,
    },
    initialTs: ampFactor.initialTs.toString(),
    targetValue: {
      value: ampFactor.targetValue.value.toString(),
      decimals: ampFactor.targetValue.decimals,
    },
    targetTs: ampFactor.targetTs.toString(),
  }
};

export const writePoolStateToFile = (
  poolStatePath: string,
  poolStateStr: string
) => {
  fs.writeFileSync(poolStatePath, poolStateStr);
};
