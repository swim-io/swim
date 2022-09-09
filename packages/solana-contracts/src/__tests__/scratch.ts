import { BN } from "@project-serum/anchor";
import * as byteify from "byteify";

function main() {
  const usdcOutputTokenIndex = 1;
  const bn = new BN(usdcOutputTokenIndex);
  const t1 = byteify.serializeUint16(usdcOutputTokenIndex);
  const t2 = bn.toArrayLike(Buffer, "le", 2);
  const t3 = bn.toArrayLike(Buffer, "be", 2);
  //    t1: 0001
  //     t2: 0100
  //     t3: 0001
  console.info(`
    t1: ${Buffer.from(t1).toString("hex")}
    t2: ${t2.toString("hex")}
    t3: ${t3.toString("hex")}
  `);
}
void main();
