import { BigNumber } from "ethers";

const offsetTracker = () => {
  let offset = 0;
  return (size: number) => (offset += size) - size; //postInc
};

const readBytes = (buf: Buffer, offset: (size: number) => number, size: number) => {
  const curOffset = offset(size);
  return buf.subarray(curOffset, curOffset + size);
};

export type Signature = {
  readonly guardianIndex: number;
  readonly r: Buffer;
  readonly s: Buffer;
  readonly v: number;
};

export class CoreBridgeMessage {
  constructor(
    readonly version: number,
    readonly guardianSetIndex: number,
    readonly signatures: readonly Signature[],
    readonly timestamp: number,
    readonly nonce: number,
    readonly emitterChain: number,
    readonly emitterAddress: Buffer,
    readonly sequence: BigNumber,
    readonly consistencyLevel: number,
    readonly payload: Buffer
  ) {}

  static decode(encodedVm: Buffer) {
    const offset = offsetTracker();
    const version = encodedVm.readUInt8(offset(1));
    const guardianSetIndex = encodedVm.readUInt32BE(offset(4));
    const sigCount = encodedVm.readUInt8(offset(1));
    const signatures = Array.from(Array(sigCount).keys()).map(() => ({
      guardianIndex: encodedVm.readUint8(offset(1)),
      r: readBytes(encodedVm, offset, 32),
      s: readBytes(encodedVm, offset, 32),
      v: encodedVm.readUint8(offset(1)),
    }));
    const timestamp = encodedVm.readUInt32BE(offset(4));
    const nonce = encodedVm.readUInt32BE(offset(4));
    const emitterChain = encodedVm.readUInt16BE(offset(2));
    const emitterAddress = readBytes(encodedVm, offset, 32);
    const sequence = BigNumber.from(encodedVm.readBigUint64BE(offset(8)));
    const consistencyLevel = encodedVm.readUInt8(offset(1));
    const payload = encodedVm.subarray(offset(0));
    return new CoreBridgeMessage(
      version,
      guardianSetIndex,
      signatures,
      timestamp,
      nonce,
      emitterChain,
      emitterAddress,
      sequence,
      consistencyLevel,
      payload
    );
  }

  encode() {
    const fixedSize = 57;
    const perSignatureSize = 66;
    const encoded = Buffer.alloc(fixedSize + this.signatures.length * perSignatureSize);
    const offset = offsetTracker();
    encoded.writeUInt8(this.version, offset(1));
    encoded.writeUInt32BE(this.guardianSetIndex, offset(4));
    encoded.writeUInt8(this.signatures.length, offset(1));
    for (const signature of this.signatures) {
      encoded.writeUInt8(signature.guardianIndex, offset(1));
      signature.r.copy(encoded, offset(32));
      signature.s.copy(encoded, offset(32));
      encoded.writeUInt8(signature.v, offset(1));
    }
    encoded.writeUInt32BE(this.timestamp, offset(4));
    encoded.writeUInt32BE(this.nonce, offset(4));
    encoded.writeUInt16BE(this.emitterChain, offset(2));
    this.emitterAddress.copy(encoded, offset(16));
    encoded.writeBigUInt64BE(this.sequence.toBigInt(), offset(8));
    encoded.writeUInt8(this.consistencyLevel, offset(1));
    return Buffer.concat([encoded, this.payload]);
  }
}

export class TokenBridgePayload {
  constructor(
    readonly payloadId: number,
    readonly amount: BigNumber,
    readonly originAddress: Buffer,
    readonly originChain: number,
    readonly targetAddress: Buffer,
    readonly targetChain: number,
    readonly senderAddress: Buffer,
    readonly extraPayload: Buffer
  ) {}

  static decode(coreBridgePayload: Buffer) {
    const offset = offsetTracker();
    const payloadId = coreBridgePayload.readUInt8(offset(1));
    const amount = BigNumber.from(readBytes(coreBridgePayload, offset, 32));
    const originAddress = readBytes(coreBridgePayload, offset, 32);
    const originChain = coreBridgePayload.readUInt16BE(offset(2));
    const targetAddress = readBytes(coreBridgePayload, offset, 32);
    const targetChain = coreBridgePayload.readUInt16BE(offset(2));
    const senderAddress = readBytes(coreBridgePayload, offset, 32);
    const extraPayload = coreBridgePayload.subarray(offset(0));
    return new TokenBridgePayload(
      payloadId,
      amount,
      originAddress,
      originChain,
      targetAddress,
      targetChain,
      senderAddress,
      extraPayload
    );
  }

  encode() {
    const encoded = Buffer.alloc(133);
    const offset = offsetTracker();
    encoded.writeUInt8(this.payloadId, offset(1));
    encoded.write(this.amount.toHexString().slice(2).padStart(64, "0"), offset(32), "hex");
    this.originAddress.copy(encoded, offset(32));
    encoded.writeUInt16BE(this.originChain, offset(2));
    this.targetAddress.copy(encoded, offset(32));
    encoded.writeUInt16BE(this.targetChain, offset(2));
    this.senderAddress.copy(encoded, offset(32));
    return Buffer.concat([encoded, this.extraPayload]);
  }
}

export class SwimPayload {
  private static readonly defaultMemo = Buffer.alloc(16).fill(0);

  constructor(
    readonly version: number,
    readonly toOwner: Buffer,
    readonly propellerEnabled = false,
    readonly gasKickstart = false,
    readonly maxPropellerFee = BigNumber.from(0),
    readonly toTokenNumber = 0,
    readonly memo = SwimPayload.defaultMemo
  ) {}

  static decode(tokenBridgePayload3: Buffer) {
    const offset = offsetTracker();
    const version = tokenBridgePayload3.readUInt8(offset(1));
    const toOwner = readBytes(tokenBridgePayload3, offset, 32);
    if (tokenBridgePayload3.length == offset(0)) return new SwimPayload(version, toOwner);

    const propellerEnabled = tokenBridgePayload3.readUInt8(offset(1)) == 1 ? true : false;
    const gasKickstart = tokenBridgePayload3.readUInt8(offset(1)) == 1 ? true : false;
    const maxPropellerFee = BigNumber.from(tokenBridgePayload3.readBigUint64BE(offset(8)));
    const toTokenNumber = tokenBridgePayload3.readUInt16BE(offset(2));
    if (tokenBridgePayload3.length == offset(0))
      return new SwimPayload(
        version,
        toOwner,
        propellerEnabled,
        gasKickstart,
        maxPropellerFee,
        toTokenNumber
      );

    const memo = readBytes(tokenBridgePayload3, offset, 16);
    return new SwimPayload(
      version,
      toOwner,
      propellerEnabled,
      gasKickstart,
      maxPropellerFee,
      toTokenNumber,
      memo
    );
  }

  encode() {
    const encoded = Buffer.alloc(
      this.memo != SwimPayload.defaultMemo ? 61 : this.propellerEnabled ? 45 : 33
    );
    const offset = offsetTracker();
    encoded.writeUInt8(this.version, offset(1));
    this.toOwner.copy(encoded, offset(32));
    if (!this.propellerEnabled) return encoded;
    encoded.writeUInt8(1, offset(1));
    encoded.writeUInt8(this.gasKickstart ? 1 : 0, offset(1));
    encoded.writeBigUInt64BE(this.maxPropellerFee.toBigInt(), offset(8));
    encoded.writeUInt16BE(this.toTokenNumber, offset(2));
    if (this.memo == SwimPayload.defaultMemo) return encoded;
    this.memo.copy(encoded, offset(16));
    return encoded;
  }
}

export const decodeVaa = (encodedVm: Buffer | string) => {
  const core = CoreBridgeMessage.decode(
    typeof encodedVm == "string" ? Buffer.from(encodedVm, "hex") : encodedVm
  );
  const token = TokenBridgePayload.decode(core.payload);
  const swim = SwimPayload.decode(token.extraPayload);

  return { core, token, swim };
};
