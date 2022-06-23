import { Buffer } from "buffer";

import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import type { SwimPoolState } from "./poolState";
import { deserializeSwimPool } from "./poolState";

describe("deserializeSwimPool", () => {
  it("deserializes a SwimPoolState", () => {
    const numTokens = 6;
    const serialized = Buffer.from(
      "00000100000000000000000000000000000000e8030000000000000000000000000000002c01000064000000990e9632b0b9f2e636feb3f0a4220f8aadf9677b451c982a4151af42e0362e8800c6fa7af3bedbad3a3d65f36aabc97431b1bbe4c2d2f6e0e47ca60203452f5d61ce010e60afedb22717bd63192f54145a3f965a33bb82d2c7029eb2ce1e20826487f81d7f931ba1c5db9f5a8b2ac5e149ef9c76d9cf196615bd21163316e8c410bdd7aa20228a7bc21e67ddfe78d5d89b986d4bf5c8d5dc9d4574d81ab11e5a02012262c2067049b5c6d6a6869e7a37bbee162637f78192c3b15e8427676a422574616a65b31ff1d8f707eb279bf8a729a6644151b16d72f9694af6ae499881ed02020202000048ccc8aa094ba7b3495776e123587f2454a935671548ccdc3f4311a9febbdd18fb56a83f5d24d5e7513f96b8c24bff58e7259e92f2fd6f01162f9b0b5188d23e32bf5157ba942716dbab775cde82f881ededa5a96b325714e2bef602679dc3cd1205cdb06ade7ab0c78b50a6e7cc2dd83edfa10423348951b7ce231b6c920334bfcf845603efc68ddea00872ad53de92ed69227e373bdca1a21f78782ec87fec7b90e07d2a4fd0d055d08430d9524a755cacd7a7a531ed91705e8b823e59d820cf609300f5b15b7009876930926f1b5c4a6ecdbc035219127e8ff47ef369abbc7ef4d44674e963fe6e94097d729f1c29c382a3ca684cfd454347f97ee142959e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a314416888e007000000000000000000",
      "hex",
    );
    const expected: SwimPoolState = {
      nonce: 0,
      isPaused: false,
      ampFactor: {
        initialValue: {
          value: new BN(0),
          decimals: 0,
        },
        initialTs: new BN(0),
        targetValue: {
          value: new BN(0),
          decimals: 0,
        },
        targetTs: new BN(0),
      },
      lpFee: 0,
      governanceFee: 0,
      lpMintKey: PublicKey.default,
      lpDecimalEqualizer: 0,
      tokenMintKeys: [
        PublicKey.default,
        PublicKey.default,
        PublicKey.default,
        PublicKey.default,
        PublicKey.default,
        PublicKey.default,
      ],
      tokenDecimalEqualizers: [0, 0, 0, 0, 0, 0],
      tokenKeys: [
        PublicKey.default,
        PublicKey.default,
        PublicKey.default,
        PublicKey.default,
        PublicKey.default,
        PublicKey.default,
      ],
      governanceKey: PublicKey.default,
      governanceFeeKey: PublicKey.default,
      preparedGovernanceKey: PublicKey.default,
      governanceTransitionTs: new BN(0),
      preparedLpFee: 0,
      preparedGovernanceFee: 0,
      feeTransitionTs: new BN(0),
      previousDepth: new BN(0),
    };
    expect(deserializeSwimPool(numTokens, serialized)).toEqual(expected);
  });
});
