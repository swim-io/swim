import { programs } from "@metaplex/js";
import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { RpcResponseAndContext, SignatureResult } from "@solana/web3.js";
import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import * as redeemerIdl from "../../../idl/redeem.json";
import { getAssociatedTokenAddress } from "../../models/solana/utils";
import type { NftData } from "../solana";
import {
  useAnchorProvider,
  useCreateSplTokenAccountsMutation,
} from "../solana";

import { useRedeemer } from "./useRedeemer";

// Note, this address should be somewhere more general if it ever has a usecase beyond the redeemer.
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

const {
  metadata: { Metadata, MasterEdition },
} = programs;

export const useRedeemMutation = (
  nft: NftData | null,
): UseMutationResult<null | RpcResponseAndContext<SignatureResult>> => {
  const createATA = useCreateSplTokenAccountsMutation();
  const anchorProvider = useAnchorProvider();
  const { spec, pda, vault } = useRedeemer(
    nft?.metadata.collection?.key ?? null,
  );
  return useMutation(
    async (): Promise<null | RpcResponseAndContext<SignatureResult>> => {
      if (!nft || !nft.metadata.collection || !anchorProvider) {
        // TODO: fix
        return null;
      }
      const anchorWallet = anchorProvider.wallet;
      const { mint: nftMint, collection: nftCollection } = nft.metadata;

      const [ownerRedeemTokenAccount] = await createATA.mutateAsync([
        spec.mint.toBase58(),
      ]);
      const program = new anchor.Program(
        redeemerIdl as any,
        spec.id,
        anchorProvider,
      );

      const nftPublicKey = new PublicKey(nftMint);
      const collectionPublicKey = new PublicKey(nftCollection.key);
      // nft shit

      const collectionMetadata = await Metadata.getPDA(collectionPublicKey);
      const metadataPDA = await Metadata.getPDA(nftPublicKey);
      const editionPDA = await MasterEdition.getPDA(nftPublicKey);
      const ownerNftAta = getAssociatedTokenAddress(
        nftPublicKey,
        anchorWallet.publicKey,
      );
      const redeemTxSig = await program.methods
        .redeem()
        .accounts({
          nftMetadata: metadataPDA,
          nft: nftPublicKey,
          nftEdition: editionPDA,
          ownerNftAta: ownerNftAta,
          owner: anchorWallet.publicKey,
          ownerRedeemTokenAccount: ownerRedeemTokenAccount.address,
          mplRedeemer: pda,
          vault,
          redeemerCollection: collectionPublicKey,
          redeemerCollectionMetadata: collectionMetadata,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      return anchorProvider.connection.confirmTransaction(redeemTxSig);
    },
  );
};
