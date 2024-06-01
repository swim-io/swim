import { Buffer } from "buffer";

import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import type { SolanaPoolState } from "./poolState";
import { deserializeSolanaPoolState } from "./poolState";

describe("deserializeSolanaPoolState", () => {
  it("deserializes a SolanaPoolState", () => {
    const serialized = Buffer.from(
      "20c6d088ba17fa93ff0001000000000000000000000000000000002c010000000000000000000000000000002c01000064000000296b21c9a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe267190054e7ff24b975efb9d141828d813d45a0e8d996f7ece50fb6c0ea6209814540606f55543e2dfdef31aa4341ab41500e34fa1fdd29d3180b479396998345e896d400002ecb88c3adfc243a8d4d4213091f8e70920abc33db7b2cefa1ba7c431dbefa9168cffcd754af9b3ebf6a194e99d9ec5a443949cf81a0b9dcf87fc5322daee2633651145b5235dd54b936805e22d8d4ad567c670ac7d7d0d56717ac9627e195ce87bf6424e0aab4369c10322c5e6cb388ecbff669bbd7df4a88617b1cd1f33d63d56eda0d27700d468b7ed03d29fe763f5105deaba768ca3247e60737f64d281f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a7716c6bb9b700000000000000000000",
      "hex",
    );
    const expected: SolanaPoolState = {
      bump: 255,
      isPaused: false,
      ampFactor: {
        initialValue: {
          value: new BN(1),
          decimals: 0,
        },
        initialTs: new BN(0),
        targetValue: {
          value: new BN(300),
          decimals: 0,
        },
        targetTs: new BN(0),
      },
      lpFee: { value: 300 },
      governanceFee: { value: 100 },
      lpMintKey: new PublicKey("3ngTtoyP9GFybFifX1dr7gCFXFiM2Wr6NfXn6EuU7k6C"),
      lpDecimalEqualizer: 0,
      tokenMintKeys: [
        new PublicKey("6iSRgpK4oiqJZuhpLsTecW3n9xBKUq9N3VPQN7RinYwq"),
        new PublicKey("8VbikoRxEoyYzTDzDcPTSsGk2E5mM7fK1WrVpKrVd75M"),
      ],
      tokenDecimalEqualizers: [0, 0],
      tokenKeys: [
        new PublicKey("49fm8MaATyD4BwaqxXmjASGuR3WLg8PL1SvMiYpyTdrx"),
        new PublicKey("849M4dvrdoUqsn7t6eVWWNos8Q8RfLJxRTzQC46KGoYE"),
      ],
      governanceKey: new PublicKey(
        "A8uJnBYSmjEFtjfuCFCaXCFNtqfzoBBYXpPDVvR3kvkS",
      ),
      governanceFeeKey: new PublicKey(
        "FN9strke8tiDYmRNH3LFtg9zjJpTsxgTPHUegsQsUiai",
      ),
      pauseKey: new PublicKey("4f2ivZ8B13d5CTGQpRWcLYjgnqD7ut7mezj3sj1BwZMw"),
      preparedGovernanceKey: PublicKey.default,
      governanceTransitionTs: new BN(0),
      preparedLpFee: { value: 0 },
      preparedGovernanceFee: { value: 0 },
      feeTransitionTs: new BN(0),
      previousDepth: new BN(202006999101863),
    };
    const decoded = deserializeSolanaPoolState(serialized);

    expect(decoded.bump).toBe(expected.bump);
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
    expect(decoded.lpFee.value).toBe(expected.lpFee.value);
    expect(decoded.governanceFee.value).toBe(expected.governanceFee.value);
    expect(decoded.lpMintKey).toStrictEqual(expected.lpMintKey);
    expect(decoded.lpDecimalEqualizer).toBe(expected.lpDecimalEqualizer);
    decoded.tokenMintKeys.forEach((tokenMintKey, i) => {
      expect(tokenMintKey).toStrictEqual(expected.tokenMintKeys[i]);
    });
    decoded.tokenDecimalEqualizers.forEach((tokenDecimalEqualizer, i) => {
      expect(tokenDecimalEqualizer).toBe(expected.tokenDecimalEqualizers[i]);
    });
    decoded.tokenKeys.forEach((tokenKey, i) => {
      expect(tokenKey).toStrictEqual(expected.tokenKeys[i]);
    });
    expect(decoded.governanceKey).toStrictEqual(expected.governanceKey);
    expect(decoded.governanceFeeKey).toStrictEqual(expected.governanceFeeKey);
    expect(decoded.pauseKey).toStrictEqual(expected.pauseKey);
    expect(decoded.preparedGovernanceKey).toStrictEqual(
      expected.preparedGovernanceKey,
    );
    expect(
      decoded.governanceTransitionTs.eq(expected.governanceTransitionTs),
    ).toBe(true);
    expect(decoded.preparedLpFee.value).toBe(expected.preparedLpFee.value);
    expect(decoded.preparedGovernanceFee.value).toBe(
      expected.preparedGovernanceFee.value,
    );
    expect(decoded.feeTransitionTs.eq(expected.feeTransitionTs)).toBe(true);
    expect(decoded.previousDepth.eq(expected.previousDepth)).toBe(true);
  });
});
