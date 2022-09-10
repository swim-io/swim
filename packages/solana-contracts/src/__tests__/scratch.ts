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

  let memo = 0;

  const memoBuffer = Buffer.alloc(16);
  const memoStr = (++memo).toString().padStart(16, "0");
  memoBuffer.write(memoStr);
  //
  // Buffer.from(memoStr).copy(memoBuffer, memoBuffer.length - memoStr.length);
  // const memoByteArr = Uint8Array.from(memoBuffer);

  // 00000000000000000000000000000031
  console.info(`
    memoBuffer: ${memoBuffer.toString()}
    memoBufferHex: ${memoBuffer.toString("hex")}
  `);

  const payloadBuffer = Buffer.alloc(17);
  let offset = 0;
  payloadBuffer.writeUint8(Number(99));
  offset++;
  payloadBuffer.write(memoBuffer.toString("hex"), offset, "hex");
  const { prefix: parsedPrefix, memo: parsedMemo } = parseBuffer(payloadBuffer);
  console.info(`
    parsedPrefix: ${parsedPrefix}
    parsedMemo: ${parsedMemo.toString()}
    parsedMemoHex: ${parsedMemo.toString("hex")}
    parsedMemoBN: ${new BN(parsedMemo).toString()}

  `);
  // console.info(`t: ${JSON.stringify(t)}`);
}

function parseBuffer(buffer: Buffer): {
  readonly prefix: number;
  readonly memo: Buffer;
} {
  let offset = 0;
  const prefix = buffer.readUint8(offset);
  offset++;
  const memo = buffer.subarray(offset, offset + 16);
  return {
    prefix,
    memo,
  };
}
void main();
