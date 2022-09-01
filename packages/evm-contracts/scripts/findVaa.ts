import {
  getSignedVAAWithRetry,
  getEmitterAddressEth,
  uint8ArrayToHex
} from "@certusone/wormhole-sdk";
import type { ReadonlyRecord } from "@swim-io/utils";
import type { RpcError } from "grpc-web";
import { StatusCode } from "grpc-web";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";

const WORMHOLE_TOKEN_BRIDGE_ADDRESS_TESTNET_GOERLI = "0xF890982f9310df57d00f659cf4fd87e65adEd8d7"
const WORMHOLE_RPC_HOSTS = [
  "https://wormhole-v2-testnet-api.certus.one"
];

//copied from guardiansRpc
const INTERNAL_ERROR_MESSAGE =
  "Something went wrong, please contact Swim support.";
const UNAVAILABLE_MESSAGE =
  "We are unable to reach the Wormhole guardians. Please try again later.";

const MESSAGES: Partial<ReadonlyRecord<StatusCode, string>> = {
  [StatusCode.INTERNAL]: INTERNAL_ERROR_MESSAGE,
  [StatusCode.INVALID_ARGUMENT]: INTERNAL_ERROR_MESSAGE,
  [StatusCode.NOT_FOUND]:
    "Could not confirm transfer with Wormhole guardians. This usually happens when the source blockchain is congested. Please try again later.",
  [StatusCode.UNAVAILABLE]: UNAVAILABLE_MESSAGE,
  [StatusCode.UNKNOWN]: UNAVAILABLE_MESSAGE,
};

const isRpcError = (error: unknown): error is RpcError => {
  return (
    error instanceof Error &&
    "code" in error &&
    Object.values(StatusCode).includes(
      (error as Record<string, unknown>).code as string,
    )
  );
};


(async () => {
  //const sequence = "1680"; // the first one that read from guardian network
  const sequence = "1827";
  console.log("starting to fetch vaa sequence " + sequence);
  const vaa = await getSignedVAAWithRetry(
    WORMHOLE_RPC_HOSTS,
    2, // goerli chain id
    getEmitterAddressEth(WORMHOLE_TOKEN_BRIDGE_ADDRESS_TESTNET_GOERLI),
    sequence,
    {
      transport: NodeHttpTransport(), //This should only be needed when running in node.
    },
    1000,
    10
  ).catch((error) => {
    if (isRpcError(error)) {
      const message = MESSAGES[error.code];
      if (message) {
        console.log('message');
        console.log(message)
        throw error;
      }
    }
    throw error;
  });

  console.log("vaa");
  console.log(uint8ArrayToHex(vaa.vaaBytes));

  console.log("done");
})();
