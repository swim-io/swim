import fs from "fs";
import path from "path";

import { programs } from "@metaplex/js";
import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import { useEffect } from "react";

import { useAnchorWallet, useSolanaConnection } from "../../contexts";
import { useCreateSplTokenAccountsMutation } from "../solana";

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

const redeemProgramID = new anchor.web3.PublicKey(
  "7frYsb48TdaenQpmVxRHgMnNL861aK1aeq6aTkVrUkDt",
);

const xswimMintAccountKey = new anchor.web3.PublicKey(
  "HDiJt8KK7qHZhkkyRyv6TTWzbEppCrpGZQ4YE5igarYu",
);

const REDEEMER_PREFIX = "redeemer";
const utf8 = anchor.utils.bytes.utf8;

const {
  metadata: { Metadata, MasterEdition },
} = programs;

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

export const useRedeem = (nftMint: string, nftCollection: string): void => {
  // const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  const wally = useAnchorWallet();

  const provider = new anchor.AnchorProvider(
    solanaConnection.rawConnection,
    wally,
    anchor.AnchorProvider.defaultOptions(),
  );
  anchor.setProvider(provider);

  // where is this
  const idl = JSON.parse(
    fs.readFileSync(path.resolve("../../config/idl.json"), "utf8"),
  );
  const program = new anchor.Program(idl, redeemProgramID, provider);

  const nftPublicKey = new anchor.web3.PublicKey(nftMint);
  const collectionPublicKey = new anchor.web3.PublicKey(nftCollection);
  useEffect(() => {
    async function doNeedful(): Promise<void> {
      const collectionMetadata = await Metadata.getPDA(collectionPublicKey);
      const redeemerMint = xswimMintAccountKey;

      const metadataPDA = await Metadata.getPDA(nftPublicKey);
      const editionPDA = await MasterEdition.getPDA(nftPublicKey);
      const ownerNftAta = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        nftPublicKey,
        wally.publicKey,
      ); // TODO signer?
      const [redeemerPDA] = await getRedeemerPDA(
        collectionPublicKey,
        redeemerMint,
        redeemProgramID,
      );
      const redeemerVault = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        redeemerMint,
        redeemerPDA,
        true,
      );

      const [ownerRedeemTokenAccount] =
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await useCreateSplTokenAccountsMutation().mutateAsync([
          redeemerMint.toBase58(),
        ]);

      const redeemTxSig = await program.methods
        .redeem()
        .accounts({
          nft: collectionPublicKey,
          nftMetadata: metadataPDA,
          nftEdition: editionPDA,
          ownerNftAta: ownerNftAta,
          redeemer: redeemerPDA,
          redeemerVault,
          redeemerCollection: collectionPublicKey,
          redeemerCollectionMetadata: collectionMetadata,
          owner: provider.wallet.publicKey,
          ownerRedeemTokenAccount: ownerRedeemTokenAccount.address,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .rpc();
      await solanaConnection.rawConnection.confirmTransaction(redeemTxSig);
    }
    void doNeedful();
  }, [
    collectionPublicKey,
    nftPublicKey,
    program.methods,
    provider.wallet.publicKey,
    solanaConnection.rawConnection,
    wally.publicKey,
  ]);
};
