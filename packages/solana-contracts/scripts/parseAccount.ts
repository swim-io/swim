import { AnchorProvider, web3 } from "@project-serum/anchor";

import {
  formatParsedTokenTransferWithSwimPayloadPostedMessage,
  parseTokenTransferWithSwimPayloadPostedMessage,
} from "../src/__tests__/propeller/propellerUtils";

const envProvider = AnchorProvider.env();

async function parseWormholeMessageAccount(address: web3.PublicKey) {
  const wormholeMessageAccountInfo =
    await envProvider.connection.getAccountInfo(address);
  if (!wormholeMessageAccountInfo) {
    console.error(`No account found at ${address.toBase58()}`);
    return;
  }
  const parsedTokenTransferWithSwimPayloadPostedMessage =
    await parseTokenTransferWithSwimPayloadPostedMessage(
      wormholeMessageAccountInfo.data,
    );
  console.info(`finished parsing`);
  const formattedMessage =
    formatParsedTokenTransferWithSwimPayloadPostedMessage(
      parsedTokenTransferWithSwimPayloadPostedMessage,
    );
  console.info(
    `formattedMessage: ${JSON.stringify(formattedMessage, null, 2)}`,
  );
}

const main = async (): Promise<void> => {
  const [address] = process.argv.slice(2);
  if (!address) {
    console.error("Please provide a wormhole message account address");
    process.exit(1);
  }
  console.info(`address: ${address}`);
  await parseWormholeMessageAccount(new web3.PublicKey(address));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
