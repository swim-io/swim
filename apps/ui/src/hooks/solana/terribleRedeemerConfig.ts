// import AURORA_USN_SVG from "../images/tokens/lp_metapool_aurora_usn.svg";
// import FANTOM_USDC_SVG from "../images/tokens/lp_metapool_fantom_usdc.svg";
// import FANTOM_USDT_SVG from "../images/tokens/lp_metapool_fantom_usdt.svg";
// import LUNA_UST_SVG from "../images/tokens/lp_metapool_luna_ust.svg";
import * as anchor from "@project-serum/anchor";

import { EcosystemId } from "./ecosystem";
import { Env } from "./env";



export interface TokenDetails {
  readonly address: string;
  readonly decimals: number;
}

export type TokenDetailsByEcosystem = ReadonlyMap<EcosystemId, TokenDetails>;

export interface TokenSpec {
  readonly id: string;
  readonly symbol: string;
  readonly displayName: string;
  readonly icon: string;
  readonly isStablecoin: boolean;
  readonly nativeEcosystem: EcosystemId;
  readonly detailsByEcosystem: TokenDetailsByEcosystem;
}

const USDC_SYMBOL = "USDC";
const USDC_NAME = "USD Coin";
const USDT_SYMBOL = "USDT";
const USDT_NAME = "Tether USD";
const BUSD_SYMBOL = "BUSD";
const BUSD_NAME = "Binance USD";

const mainnetTokens: readonly TokenSpec[] = []

    const REDEEMER_PREFIX = "redeemer";
    const utf8 = anchor.utils.bytes.utf8;
    const getRedeemerPDA = async (
        collection: anchor.web3.PublicKey,
        redeemerMint: anchor.web3.PublicKey,
        programId: anchor.web3.PublicKey,
      ): Promise<readonly [anchor.web3.PublicKey, number]> => {
        return await anchor.web3.PublicKey.findProgramAddress(
          [
            utf8.encode(REDEEMER_PREFIX),
            collection.toBuffer(),
            redeemerMint.toBuffer(),
          ],
          programId,
        );
      };

    //   const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    //     "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
    //   );

    // export const xswimMintAccountKey = new anchor.web3.PublicKey(
    //     "HDiJt8KK7qHZhkkyRyv6TTWzbEppCrpGZQ4YE5igarYu",
    //   );

    // const redeemProgramID = new anchor.web3.PublicKey(
    //     "Gn4eV6vJJ3vzi2y8ANoKAhiEJT6YimdSxBpn8r1nioq5",
    //   );

    // const redeemerMint = new anchor.web3.PublicKey(
    //     "Fh2GmZShyX16LhABEYbd3i1f7fa8CBpLw6eyFEDQ1XkU",
    //   );

RedeemerSpec {
    readonly id: string;
    readonly tokenMint: TokenDetails;
    readonly tokenAccountKey: string;

}
