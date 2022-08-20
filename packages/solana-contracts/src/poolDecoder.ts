import type { Idl } from "@project-serum/anchor";
import { BorshAccountsCoder } from "@project-serum/anchor";

import * as TwoPoolIDL from "./artifacts/two_pool.json";

const PoolDecoder = new BorshAccountsCoder(TwoPoolIDL as Idl);
// Note: name is from the two_pool.json file not the two_pool.ts. Camelcase is different but
// the name is meant to match the original rust code.
const TwoPoolAccountName = "TwoPool";

export function parsePoolAccount(data: Buffer) {
  const discriminator =
    BorshAccountsCoder.accountDiscriminator(TwoPoolAccountName);
  if (discriminator.compare(data.slice(0, 8))) {
    console.error("incorrect account name during parsing");
    return null;
  }

  try {
    return PoolDecoder.decode(TwoPoolAccountName, data);
  } catch (_e) {
    console.error("unknown account name during parsing");
    return null;
  }
}
