import { PublicKey } from "@solana/web3.js";
import type {
  SwimPoolConstantState,
  SwimPoolMutableState,
} from "@swim-io/solana-types";

export interface SwimPoolConstantProperties {
  readonly numberOfTokens: number;
  readonly programId: PublicKey;
  readonly stateKey: PublicKey;
  readonly authorityKey: PublicKey;
  readonly feeDecimals: number;
}

export const hexapool: SwimPoolConstantProperties &
  SwimPoolConstantState &
  Pick<SwimPoolMutableState, "governanceFeeKey"> = {
  numberOfTokens: 6,
  programId: new PublicKey("SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC"),
  stateKey: new PublicKey("8cUvGTFvSWx9WPebYYfDxwiJPdGx2EJUtpve6jP9SBma"),
  nonce: 0,
  authorityKey: new PublicKey("AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb"),
  lpMintKey: new PublicKey("BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1"),
  governanceFeeKey: new PublicKey(
    "9Yau6DnqYasBUKcyxQJQZqThvUnqZ32ZQuUCcC2AdT9P",
  ),
  feeDecimals: 6,
  lpDecimalEqualizer: 0,
  tokenMintKeys: [
    new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // solana-usdc
    new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"), // solana-usdt
    new PublicKey("A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM"), // ethereum-usdc
    new PublicKey("Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1"), // ethereum-usdt
    new PublicKey("5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2"), // bnb-busd
    new PublicKey("8qJSyQprMC57TWKaYEmetUR3UUiTP2M3hXdcvFhkZdmv"), // bnb-usdt
  ],
  tokenDecimalEqualizers: [2, 2, 2, 2, 0, 0],
  tokenKeys: [
    new PublicKey("5uBU2zUG8xTLA6XwwcTFWib1p7EjCBzWbiy44eVASTfV"), // solana-usdc
    new PublicKey("Hv7yPYnGs6fpN3o1NZvkima9mKDrRDJtNxf23oKLCjau"), // solana-usdt
    new PublicKey("4R6b4aibi46JzAnuA8ZWXrHAsR1oZBTZ8dqkuer3LsbS"), // ethereum-usdc
    new PublicKey("2DMUL42YEb4g1HAKXhUxL3Yjfgoj4VvRqKwheorfFcPV"), // ethereum-usdt
    new PublicKey("DukQAFyxR41nbbq2FBUDMyrtF2CRmWBREjZaTVj4u9As"), // bnb-busd
    new PublicKey("9KMH3p8cUocvQRbJfKRAStKG52xCCWNmEPsJm5gc8fzw"), // bnb-usdt
  ],
};
