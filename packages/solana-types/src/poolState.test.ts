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
          value: new BN(1),
          decimals: 0,
        },
        initialTs: new BN(0),
        targetValue: {
          value: new BN(1000),
          decimals: 0,
        },
        targetTs: new BN(0),
      },
      lpFee: 300,
      governanceFee: 100,
      lpMintKey: new PublicKey("BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1"),
      lpDecimalEqualizer: 0,
      tokenMintKeys: [
        new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
        new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
        new PublicKey("A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM"),
        new PublicKey("Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1"),
        new PublicKey("5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2"),
        new PublicKey("8qJSyQprMC57TWKaYEmetUR3UUiTP2M3hXdcvFhkZdmv"),
      ],
      tokenDecimalEqualizers: [2, 2, 2, 2, 0, 0],
      tokenKeys: [
        new PublicKey("5uBU2zUG8xTLA6XwwcTFWib1p7EjCBzWbiy44eVASTfV"),
        new PublicKey("Hv7yPYnGs6fpN3o1NZvkima9mKDrRDJtNxf23oKLCjau"),
        new PublicKey("4R6b4aibi46JzAnuA8ZWXrHAsR1oZBTZ8dqkuer3LsbS"),
        new PublicKey("2DMUL42YEb4g1HAKXhUxL3Yjfgoj4VvRqKwheorfFcPV"),
        new PublicKey("DukQAFyxR41nbbq2FBUDMyrtF2CRmWBREjZaTVj4u9As"),
        new PublicKey("9KMH3p8cUocvQRbJfKRAStKG52xCCWNmEPsJm5gc8fzw"),
      ],
      governanceKey: new PublicKey(
        "ExWoeFoyYwCFx2cp9PZzj4eYL5fsDEFQEpC8REsksNpb",
      ),
      governanceFeeKey: new PublicKey(
        "9Yau6DnqYasBUKcyxQJQZqThvUnqZ32ZQuUCcC2AdT9P",
      ),
      preparedGovernanceKey: PublicKey.default,
      governanceTransitionTs: new BN(0),
      preparedLpFee: 0,
      preparedGovernanceFee: 0,
      feeTransitionTs: new BN(0),
      previousDepth: new BN(2217201306244259),
    };
    const decoded = deserializeSwimPool(numTokens, serialized);
    expect(decoded.nonce).toBe(expected.nonce);
    expect(decoded.isPaused).toBe(expected.isPaused);
    expect(
      decoded.ampFactor.initialValue.value.eq(
        expected.ampFactor.initialValue.value,
      ),
    ).toBe(true);
    expect(decoded.ampFactor.initialValue.decimals).toBe(
      expected.ampFactor.initialValue.decimals,
    );
    expect(decoded.ampFactor.initialTs.eq(expected.ampFactor.initialTs)).toBe(
      true,
    );
    expect(
      decoded.ampFactor.targetValue.value.eq(
        expected.ampFactor.targetValue.value,
      ),
    ).toBe(true);
    expect(decoded.ampFactor.targetValue.decimals).toBe(
      expected.ampFactor.targetValue.decimals,
    );
    expect(decoded.ampFactor.targetTs.eq(expected.ampFactor.targetTs)).toBe(
      true,
    );
    expect(decoded.lpFee).toBe(expected.lpFee);
    expect(decoded.governanceFee).toBe(expected.governanceFee);
    expect(decoded.lpMintKey).toStrictEqual(expected.lpMintKey);
    expect(decoded.lpDecimalEqualizer).toBe(expected.lpDecimalEqualizer);
    expect(decoded.tokenMintKeys.toString()).toBe(
      expected.tokenMintKeys.toString(),
    );
    expect(decoded.tokenDecimalEqualizers.toString()).toBe(
      expected.tokenDecimalEqualizers.toString(),
    );
    expect(decoded.tokenKeys.toString()).toBe(expected.tokenKeys.toString());
    expect(decoded.governanceKey).toStrictEqual(expected.governanceKey);
    expect(decoded.governanceFeeKey).toStrictEqual(expected.governanceFeeKey);
    expect(decoded.preparedGovernanceKey).toStrictEqual(
      expected.preparedGovernanceKey,
    );
    expect(
      decoded.governanceTransitionTs.eq(expected.governanceTransitionTs),
    ).toBe(true);
    expect(decoded.preparedLpFee).toBe(expected.preparedLpFee);
    expect(decoded.preparedGovernanceFee).toBe(expected.preparedGovernanceFee);
    expect(decoded.feeTransitionTs.eq(expected.feeTransitionTs)).toBe(true);
    expect(decoded.previousDepth.eq(expected.previousDepth)).toBe(true);
  });
});
