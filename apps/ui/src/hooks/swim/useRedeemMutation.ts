import { programs } from "@metaplex/js";
import type { Idl } from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { QueryObserverResult, UseMutationResult } from "react-query";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import redeemerIdl from "../../idl/redeem.json";
import { getAssociatedTokenAddress } from "../../models/solana/utils";
import type { NftData } from "../solana";
import {
  useAnchorProvider,
  useCreateSplTokenAccountsMutation,
} from "../solana";

// Note, this address should be somewhere more general if it ever has a usecase beyond the redeemer.
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

const {
  metadata: { Metadata, MasterEdition },
} = programs;

export const useRedeemMutation = (
  nft: NftData | null,
  refetchQuery: () => Promise<QueryObserverResult<readonly NftData[], Error>>,
): UseMutationResult<void> => {
  const createATA = useCreateSplTokenAccountsMutation();
  const anchorProvider = useAnchorProvider();
  const { redeemer } = useEnvironment(selectConfig, shallow);
  return useMutation(async (): Promise<void> => {
    if (!nft || !nft.metadata.collection || !anchorProvider) {
      throw new Error(
        "Calling 'redeem' requires a connected wallet and an NFT",
      );
    }
    const { mint: nftMint, collection: nftCollection } = nft.metadata;
    const [ownerRedeemTokenAccount] = await createATA.mutateAsync([
      new PublicKey(redeemer.vaultMint).toBase58(),
    ]);
    const program = new Program(
      redeemerIdl as Idl,
      redeemer.programAddress,
      anchorProvider,
    );
    const nftPublicKey = new PublicKey(nftMint);
    const collectionPublicKey = new PublicKey(nftCollection.key);
    const collectionMetadata = await Metadata.getPDA(collectionPublicKey);
    const metadataPDA = await Metadata.getPDA(nftPublicKey);
    const editionPDA = await MasterEdition.getPDA(nftPublicKey);
    const ownerNftAta = getAssociatedTokenAddress(
      nftPublicKey,
      anchorProvider.wallet.publicKey,
    );
    const redeemTxId = await program.methods
      .redeem()
      .accounts({
        nftMetadata: metadataPDA,
        nft: nftPublicKey,
        nftEdition: editionPDA,
        ownerNftAta: ownerNftAta,
        owner: anchorProvider.wallet.publicKey,
        ownerRedeemTokenAccount: ownerRedeemTokenAccount.address,
        mplRedeemer: new PublicKey(redeemer.programPda),
        redeemerVault: new PublicKey(redeemer.vaultTokenAccount),
        redeemerCollection: collectionPublicKey,
        redeemerCollectionMetadata: collectionMetadata,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    const txResult = await anchorProvider.connection.confirmTransaction(
      redeemTxId,
    );
    if (txResult.value.err) {
      throw new Error(txResult.value.err.toString());
    }
    await refetchQuery();
  });
};
