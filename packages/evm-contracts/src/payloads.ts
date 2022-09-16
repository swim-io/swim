import { BigNumber } from "ethers";

export class CoreBridgeMessage {
  private static readonly signatureSize = 66;

  constructor(
    readonly version: number,
    readonly guardianSetIndex: number,
    readonly signatures: readonly string[],
    readonly timestamp: number,
    readonly nonce: number,
    readonly emitterChain: number,
    readonly emitterAddress: string,
    readonly sequence: bigint,
    readonly consistencyLevel: number,
    readonly payload: Buffer
  ) {}

  static decode(encodedVm: Buffer) {
    const version = encodedVm.readUInt8(0);
    const guardianSetIndex = encodedVm.readUInt32BE(1);
    const sigCount = encodedVm.readUInt8(5);
    let offset = 6;
    const signatures = Array.from(Array(sigCount).keys()).map(() => {
      offset += this.signatureSize;
      return encodedVm.subarray(offset, offset - this.signatureSize).toString("hex");
    });
    const timestamp = encodedVm.readUInt32BE(offset);
    const nonce = encodedVm.readUInt32BE(offset + 4);
    const emitterChain = encodedVm.readUInt16BE(offset + 8);
    const emitterAddress = encodedVm.subarray(offset + 10, offset + 42).toString("hex");
    const sequence = encodedVm.readBigUint64BE(offset + 42);
    const consistencyLevel = encodedVm.readUInt8(offset + 50);
    const payload = encodedVm.subarray(offset + 51);
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
    const encoded = Buffer.alloc(57 + this.signatures.length * CoreBridgeMessage.signatureSize);
    encoded.writeUInt8(this.version, 0);
    encoded.writeUInt32BE(this.guardianSetIndex, 1);
    encoded.writeUInt8(this.signatures.length, 5);
    let offset = 0;
    for (const signature of this.signatures) {
      encoded.write(signature, offset + 6, "hex");
      offset += CoreBridgeMessage.signatureSize;
    }
    encoded.writeUInt32BE(this.timestamp, offset + 6);
    encoded.writeUInt32BE(this.nonce, offset + 10);
    encoded.writeUInt16BE(this.emitterChain, offset + 14);
    encoded.write(this.emitterAddress, offset + 16, "hex");
    encoded.writeBigUInt64BE(this.sequence, offset + 48);
    encoded.writeUInt8(this.consistencyLevel, offset + 56);
    return Buffer.concat([encoded, this.payload]);
  }
}

export class TokenBridgePayload {
  constructor(
    readonly payloadId: number,
    readonly amount: bigint,
    readonly originAddress: string,
    readonly originChain: number,
    readonly targetAddress: string,
    readonly targetChain: number,
    readonly senderAddress: string,
    readonly extraPayload: Buffer
  ) {}

  static decode(coreBridgePayload: Buffer) {
    const payloadId = coreBridgePayload.readUInt8(0);
    const amount = BigNumber.from(coreBridgePayload.subarray(1, 1 + 32)).toBigInt();
    const originAddress = coreBridgePayload.subarray(33, 33 + 32).toString("hex");
    const originChain = coreBridgePayload.readUInt16BE(65);
    const targetAddress = coreBridgePayload.subarray(67, 67 + 32).toString("hex");
    const targetChain = coreBridgePayload.readUInt16BE(99);
    const senderAddress = coreBridgePayload.subarray(101, 101 + 32).toString("hex");
    const extraPayload = coreBridgePayload.subarray(133);
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
    encoded.writeUInt8(this.payloadId, 0);
    encoded.write(this.amount.toString(16).padStart(64, "0"), 1, "hex");
    encoded.write(this.originAddress, 33, "hex");
    encoded.writeUInt16BE(this.originChain, 65);
    encoded.write(this.targetAddress, 67, "hex");
    encoded.writeUInt16BE(this.targetChain, 99);
    encoded.write(this.senderAddress, 101, "hex");
    return Buffer.concat([encoded, this.extraPayload]);
  }
}

export class SwimPayload {
  private static readonly defaultMemo = "00".repeat(16);

  constructor(
    readonly version: number,
    readonly toOwner: string,
    readonly propellerEnabled = false,
    readonly gasKickstartEnabled = false,
    readonly toTokenNumber = 0,
    readonly memo = SwimPayload.defaultMemo
  ) {}

  static decode(tokenBridgePayload3: Buffer) {
    const version = tokenBridgePayload3.readUInt8(0);
    const toOwner = tokenBridgePayload3.subarray(1, 1 + 32).toString("hex");
    if (tokenBridgePayload3.length == 33) return new SwimPayload(version, toOwner);

    const propellerEnabled = tokenBridgePayload3.readUInt8(33) == 1 ? true : false;
    const gasKickstartEnabled = tokenBridgePayload3.readUInt8(34) == 1 ? true : false;
    const toTokenNumber = tokenBridgePayload3.readUInt16BE(35);
    if (tokenBridgePayload3.length == 37)
      return new SwimPayload(
        version,
        toOwner,
        propellerEnabled,
        gasKickstartEnabled,
        toTokenNumber
      );

    const memo = tokenBridgePayload3.subarray(37, 37 + 16).toString("hex");
    return new SwimPayload(
      version,
      toOwner,
      propellerEnabled,
      gasKickstartEnabled,
      toTokenNumber,
      memo
    );
  }

  encode() {
    const encoded = Buffer.alloc(
      this.memo != SwimPayload.defaultMemo ? 53 : this.propellerEnabled ? 37 : 33
    );
    encoded.writeUInt8(this.version, 0);
    encoded.write(this.toOwner, 1, "hex");
    if (!this.propellerEnabled) return encoded;
    encoded.writeUInt8(1, 33);
    encoded.writeUInt8(this.gasKickstartEnabled ? 1 : 0, 34);
    encoded.writeUInt16BE(this.toTokenNumber, 35);
    if (this.memo == SwimPayload.defaultMemo) return encoded;
    encoded.write(this.memo, 37, "hex");
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
