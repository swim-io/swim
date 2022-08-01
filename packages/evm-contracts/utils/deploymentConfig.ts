export const SWIM_FACTORY_ADDRESS = "0x77C1f7813D79c8e6E37DE1aA631B6F961fD45648";
export const DEFAULT_SALT = "0x" + "00".repeat(32);

export const GOERLI = {
  WORMHOLE_TOKEN_BRIDGE: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
  TOKENS: [
    {
      name: "USDC",
      address: "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557",
      routingIndex: 1,
      poolIndex: 1,
      equalizer: 0,
    },
    {
      name: "USDT",
      address: "0x509Ee0d083DdF8AC028f2a56731412edD63223B9",
      routingIndex: 2,
      poolIndex: 2,
      equalizer: 0,
    },
  ],
  POOL: {
    lpName: "Test Pool LP",
    lpSymbol: "LP",
    lpEquilizer: -2,
    lpSalt: "0x" + "00".repeat(31) + "11",
    lpFee: 300, //fee as 100th of a bip (6 decimals, 1 = 100 % fee)
    ampFactor: 1_000, //1 with 3 decimals
    governanceFee: 100,
  },
};

export const ONCHAIN_ADDRESSES = {
  5: GOERLI,
};
