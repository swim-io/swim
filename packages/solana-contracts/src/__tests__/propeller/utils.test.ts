import {
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  createNonce,
  postVaaSolanaWithRetry,
  setDefaultWasm,
  tryHexToNativeAssetString,
  tryNativeToHexString,
} from "@certusone/wormhole-sdk";
import { parseUnits } from "@ethersproject/units";
import type { Program } from "@project-serum/anchor";
import {
  AnchorProvider,
  BN,
  setProvider,
  web3,
  workspace,
} from "@project-serum/anchor";
import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

import type { Propeller } from "../../artifacts/propeller";
import { USDC_TO_TOKEN_NUMBER, swimPayloadVersion } from "../consts";

import {
  encodeSwimPayload,
  formatParsedTokenTransferWithSwimPayloadPostedMessage,
  formatParsedTokenTransferWithSwimPayloadVaa,
  parseSwimPayload,
  parseTokenTransferWithSwimPayloadPostedMessage,
  parseTokenTransferWithSwimPayloadSignedVaa,
} from "./propellerUtils";
import {
  deriveMessagePda,
  encodeTokenTransferWithPayload,
} from "./tokenBridgeUtils";
import { WORMHOLE_CORE_BRIDGE, signAndEncodeVaa } from "./wormholeUtils";

setDefaultWasm("node");

const envProvider = AnchorProvider.env();

const commitment = "confirmed" as web3.Commitment;
const rpcCommitmentConfig = {
  commitment,
  preflightCommitment: commitment,
  skipPreflight: true,
};
const provider = new AnchorProvider(
  envProvider.connection,
  envProvider.wallet,
  rpcCommitmentConfig,
);
const connection = provider.connection;
const payer = (provider.wallet as NodeWallet).payer;
// const splToken = Spl.token(provider);
// const splAssociatedToken = Spl.associatedToken(provider);
// Configure the client to use the local cluster.
setProvider(provider);
const mintDecimal = 6;

let ethTokenBridgeSequence = 0;
// let ethTokenBridgeSequence = BigInt(0);

const ethTokenBridgeStr = "0x0290FB167208Af455bB137780163b7B7a9a10C16";
//0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridgeEthHexStr = tryNativeToHexString(
  ethTokenBridgeStr,
  CHAIN_ID_ETH,
);
//ethTokenBridge.toString() = gibberish
// ethTokenBridge.toString("hex") = 0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridge = Buffer.from(ethTokenBridgeEthHexStr, "hex");

const ethRoutingContractStr = "0x0290FB167208Af455bB137780163b7B7a9a10C17";
// const ethRoutingContractEthUint8Arr = tryNativeToUint8Array(
//   ethRoutingContractStr,
//   CHAIN_ID_ETH,
// );
// console.info(`
// ethRoutingContractEthUint8Arr: ${ethRoutingContractEthUint8Arr}
// Buffer.from(ethRoutingContractEthUint8Arr): ${Buffer.from(
//   ethRoutingContractEthUint8Arr,
// )}
// `);
const ethRoutingContractEthHexStr = tryNativeToHexString(
  ethRoutingContractStr,
  CHAIN_ID_ETH,
);
const ethRoutingContract = Buffer.from(ethRoutingContractEthHexStr, "hex");
const swimUsdKeypair = web3.Keypair.generate();
const propellerProgram = workspace.Propeller as Program<Propeller>;

describe("utils tests", () => {
  it("should parse token transfer with payload", async () => {
    const memo = "e45794d6c5a2750b";
    const memoBuffer = Buffer.alloc(16);
    // Uint8Array.from()
    memoBuffer.write(memo);
    // const owner = tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA);
    // encoded.write(swimPayload.owner.toString("hex"), offset, "hex");
    const propellerEnabled = true;
    const gasKickstart = false;
    const maxFee = new BN(1_000_000_000);
    const swimPayload = {
      version: swimPayloadVersion,
      owner: provider.publicKey.toBuffer(),
      // owner: owner.toBuffer(),
      propellerEnabled,
      gasKickstart,
      maxFee,
      targetTokenId: USDC_TO_TOKEN_NUMBER,
      memo: memoBuffer,
    };

    const amount = parseUnits("1", mintDecimal);
    console.info(`amount: ${amount.toString()}`);
    /**
     * this is encoding a token transfer from eth routing contract
     * with a swimUSD token address that originated on solana
     * the same as initializing a `TransferWrappedWithPayload` from eth
     */

    const nonce = createNonce().readUInt32LE(0);
    const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
      0,
      nonce,
      CHAIN_ID_ETH as number,
      ethTokenBridge,
      BigInt(++ethTokenBridgeSequence),
      encodeTokenTransferWithPayload(
        amount.toString(),
        swimUsdKeypair.publicKey.toBuffer(),
        CHAIN_ID_SOLANA,
        // propellerRedeemer,
        //"to" - if vaa.to != `Redeemer` account then it is assumed that this transfer was targeting
        // a contract(the programId of the vaa.to field) and token bridge will verify that redeemer is a pda
        //  owned by the `vaa.to` and derived the seed "redeemer".
        // note - technically you can specify an arbitrary PDA account as the `to` field
        // as long as the redeemer account is set to the same address but then we (propeller contract)
        // would need to do the validations ourselves.
        propellerProgram.programId,
        ethRoutingContract,
        encodeSwimPayload(swimPayload),
      ),
    );

    const parsedTokenTransferWithSwimPayloadVaa =
      parseTokenTransferWithSwimPayloadSignedVaa(
        tokenTransferWithPayloadSignedVaa,
      );
    console.info(`
        parsedTokenTransferWithSwimPayloadVaa: ${JSON.stringify(
          formatParsedTokenTransferWithSwimPayloadVaa(
            parsedTokenTransferWithSwimPayloadVaa,
          ),
          null,
          2,
        )}
      `);

    const {
      tokenTransferVaa: {
        core: parsedVaa,
        tokenTransfer: parsedTokenTransferFromVaa,
      },
      swimPayload: swimPayloadFromVaa,
    } = parsedTokenTransferWithSwimPayloadVaa;
    expect(parsedVaa.nonce).toEqual(nonce);
    expect(parsedTokenTransferFromVaa.tokenChain).toEqual(CHAIN_ID_SOLANA);
    expect(
      new web3.PublicKey(
        tryHexToNativeAssetString(
          parsedTokenTransferFromVaa.tokenAddress.toString("hex"),
          CHAIN_ID_SOLANA,
        ),
      ),
    ).toEqual(swimUsdKeypair.publicKey);
    expect(swimPayloadFromVaa.owner).toEqual(provider.publicKey.toBuffer());

    await postVaaSolanaWithRetry(
      connection,
      async (tx) => {
        return provider.wallet.signTransaction(tx);
      },
      WORMHOLE_CORE_BRIDGE.toBase58(),
      payer.publicKey.toBase58(),
      tokenTransferWithPayloadSignedVaa,
      10,
    );

    const [messageAccount] = await deriveMessagePda(
      tokenTransferWithPayloadSignedVaa,
      WORMHOLE_CORE_BRIDGE,
    );

    const messageAccountInfo = await connection.getAccountInfo(messageAccount);
    if (!messageAccountInfo) {
      throw new Error("MessageAccountInfo is undefined");
    }

    const parsedTokenTransferWithSwimPayloadPostedMessage =
      await parseTokenTransferWithSwimPayloadPostedMessage(
        messageAccountInfo.data,
      );
    console.info(`
        parsedTokenTransferWithSwimPayloadPostedMessage:
          ${JSON.stringify(
            formatParsedTokenTransferWithSwimPayloadPostedMessage(
              parsedTokenTransferWithSwimPayloadPostedMessage,
            ),
            null,
            2,
          )}
    `);
    const {
      tokenTransferMessage: {
        core: parsedMessage,
        tokenTransfer: parsedTokenTransferFromMessage,
      },
      swimPayload: swimPayloadFromMessage,
    } = parsedTokenTransferWithSwimPayloadPostedMessage;
    expect(parsedMessage.nonce).toEqual(parsedVaa.nonce);
    expect(parsedTokenTransferFromMessage.tokenChain).toEqual(CHAIN_ID_SOLANA);
    expect(
      new web3.PublicKey(
        tryHexToNativeAssetString(
          parsedTokenTransferFromMessage.tokenAddress.toString("hex"),
          CHAIN_ID_SOLANA,
        ),
      ),
    ).toEqual(swimUsdKeypair.publicKey);
    expect(swimPayloadFromMessage.owner).toEqual(provider.publicKey.toBuffer());
  });
  describe("encode & parse variable lengths of SwimPayload", () => {
    let memoId = 0;
    it("parses SwimPayload with all fields", () => {
      const memoBuffer = Buffer.alloc(16);
      memoBuffer.write((++memoId).toString().padStart(16, "0"));
      const swimPayload = {
        version: swimPayloadVersion,
        owner: provider.publicKey.toBuffer(),
        propellerEnabled: false,
        gasKickstart: false,
        maxFee: new BN(100),
        targetTokenId: 1,
        memo: memoBuffer,
      };
      const encodedSwimPayload = encodeSwimPayload(swimPayload);
      const parsedSwimPayload = parseSwimPayload(encodedSwimPayload);
      console.info(`
        encodedSwimPayload: ${encodedSwimPayload.toString()}
        parsedSwimPayload: ${JSON.stringify(parsedSwimPayload, null, 2)}
      `);

      expect(parsedSwimPayload.version).toEqual(swimPayload.version);
      expect(parsedSwimPayload.owner).toEqual(swimPayload.owner);
      expect(parsedSwimPayload.propellerEnabled).toEqual(false);
      expect(parsedSwimPayload.gasKickstart).toEqual(false);
      console.info(`
      swimPayload.maxFee: ${swimPayload.maxFee.toString()}
      parsedSwimPayload.maxFee: ${parsedSwimPayload.maxFee.toString()}
      `);
      expect(parsedSwimPayload.maxFee.eq(swimPayload.maxFee)).toBeTruthy();
      expect(parsedSwimPayload.targetTokenId).toEqual(
        swimPayload.targetTokenId,
      );
      expect(parsedSwimPayload.memo).toEqual(swimPayload.memo);
    });
    it("encodes & parses SwimPayload with only version & owner", () => {
      const swimPayload = {
        version: swimPayloadVersion,
        owner: provider.publicKey.toBuffer(),
      };
      const encodedSwimPayload = encodeSwimPayload(swimPayload);
      const parsedSwimPayload = parseSwimPayload(encodedSwimPayload);
      console.info(`
        encodedSwimPayload: ${encodedSwimPayload.toString()}
        parsedSwimPayload: ${JSON.stringify(parsedSwimPayload, null, 2)}
      `);

      expect(parsedSwimPayload.version).toEqual(swimPayload.version);
      expect(parsedSwimPayload.owner).toEqual(swimPayload.owner);
      expect(parsedSwimPayload.propellerEnabled).toBeUndefined();
      expect(parsedSwimPayload.gasKickstart).toBeUndefined();
      expect(parsedSwimPayload.maxFee).toBeUndefined();
      expect(parsedSwimPayload.targetTokenId).toBeUndefined();
      expect(parsedSwimPayload.memo).toBeUndefined();
    });
  });
});
