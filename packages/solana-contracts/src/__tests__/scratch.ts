import { AnchorProvider, BN, setProvider, web3 } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import * as spl from "@solana/spl-token-v2";
import type { PublicKey } from "@solana/web3.js";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { OracleJob } from "@switchboard-xyz/common";
import { SwitchboardTestContext, sleep } from "@switchboard-xyz/sbv2-utils";
import {
  AggregatorAccount,
  CrankAccount,
  JobAccount,
  LeaseAccount,
  OracleAccount,
  OracleQueueAccount,
  PermissionAccount,
  ProgramStateAccount,
  SwitchboardPermission,
  loadSwitchboardProgram,
  programWallet,
} from "@switchboard-xyz/switchboard-v2";
import * as byteify from "byteify";

// function main() {
//   const usdcOutputTokenIndex = 1;
//   const bn = new BN(usdcOutputTokenIndex);
//   const t1 = byteify.serializeUint16(usdcOutputTokenIndex);
//   const t2 = bn.toArrayLike(Buffer, "le", 2);
//   const t3 = bn.toArrayLike(Buffer, "be", 2);
//   //    t1: 0001
//   //     t2: 0100
//   //     t3: 0001
//   console.info(`
//     t1: ${Buffer.from(t1).toString("hex")}
//     t2: ${t2.toString("hex")}
//     t3: ${t3.toString("hex")}
//   `);
//
//   let memo = 0;
//
//   const memoBuffer = Buffer.alloc(16);
//   const memoStr = (++memo).toString().padStart(16, "0");
//   memoBuffer.write(memoStr);
//   //
//   // Buffer.from(memoStr).copy(memoBuffer, memoBuffer.length - memoStr.length);
//   // const memoByteArr = Uint8Array.from(memoBuffer);
//
//   // 00000000000000000000000000000031
//   console.info(`
//     memoBuffer: ${memoBuffer.toString()}
//     memoBufferHex: ${memoBuffer.toString("hex")}
//   `);
//
//   const payloadBuffer = Buffer.alloc(17);
//   let offset = 0;
//   payloadBuffer.writeUint8(Number(99));
//   offset++;
//   payloadBuffer.write(memoBuffer.toString("hex"), offset, "hex");
//   const { prefix: parsedPrefix, memo: parsedMemo } = parseBuffer(payloadBuffer);
//   console.info(`
//     parsedPrefix: ${parsedPrefix}
//     parsedMemo: ${parsedMemo.toString()}
//     parsedMemoHex: ${parsedMemo.toString("hex")}
//     parsedMemoBN: ${new BN(parsedMemo).toString()}
//
//   `);
//   // console.info(`t: ${JSON.stringify(t)}`);
// }

// function parseBuffer(buffer: Buffer): {
//   readonly prefix: number;
//   readonly memo: Buffer;
// } {
//   let offset = 0;
//   const prefix = buffer.readUint8(offset);
//   offset++;
//   const memo = buffer.subarray(offset, offset + 16);
//   return {
//     prefix,
//     memo,
//   };
// }

// export const toAccountString = (
//   label: string,
//   publicKey: PublicKey | string | undefined,
// ): string => {
//   return publicKey.toString();
//   // if (typeof publicKey === "string") {
//   //   return `${chalk.blue(label.padEnd(24, " "))} ${chalk.yellow(publicKey)}`;
//   // }
//   // if (!publicKey) return "";
//   // return `${chalk.blue(label.padEnd(24, " "))} ${chalk.yellow(
//   //   publicKey.toString(),
//   // )}`;
// };

async function startSwitchboard() {
  const provider = AnchorProvider.env();
  setProvider(provider);
  // console.info(`provider: ${JSON.stringify(provider)}`);
  console.info(`provider.wallet: ${provider.wallet.publicKey.toString()}`);
  console.info(`provider.publicKey: ${provider.publicKey.toString()}`);
  try {
    // let switchboard: SwitchboardTestContext;
    // let aggregator: PublicKey;
    const switchboard = await SwitchboardTestContext.loadFromEnv(provider);
    console.info(`set up switchboard`);
    const aggregatorAccount = await switchboard.createStaticFeed(100);
    const aggregator = aggregatorAccount.publicKey;
    // switchboard = await SwitchboardTestContext.loadDevnetQueue(
    //   provider,
    //   "F8ce7MsckeZAbAGmxjJNetxYXQa9mKr9nnrC3qKubyYy"
    // );
    // aggregatorKey = DEFAULT_SOL_USD_FEED;
    console.info(`aggregator: ${aggregator.toString()}`);
    console.info("local env detected");
    return;
  } catch (error: any) {
    console.info(`Error: SBV2 Localnet - ${JSON.stringify(error.message)}`);
    throw new Error(
      `Failed to load localenv SwitchboardTestContext: ${JSON.stringify(
        error.message,
      )}`,
    );
  }
}

// async function startSwitchboard2() {
//   const provider = AnchorProvider.env();
//   setProvider(provider);
//   const authority = (provider.wallet as NodeWallet).payer;
//   // const SWITCHBOARD_PID = new PublicKey("2TfB33aLaneQb5TNVwyDz3jSZXS6jdW2ARw1Dgf84XCG");
//   // const switchboardIdl = await anchor.Program.fetchIdl(
//   //   SWITCHBOARD_PID,
//   //   provider
//   // );
//   // if (!switchboardIdl) {
//   //   throw new Error(`failed to load Switchboard IDL`);
//   // }
//   // const program = new anchor.Program(
//   //   switchboardIdl,
//   //   SWITCHBOARD_PID,
//   //   provider
//   // );
//   const cluster = "localnet";
//   const program = await loadSwitchboardProgram(
//     cluster === "localnet" ? "devnet" : cluster,
//     provider.connection,
//     authority,
//     // {
//     //   commitment: "finalized",
//     // },
//   );
//
//   const [programStateAccount] = ProgramStateAccount.fromSeed(program);
//   console.log(toAccountString("Program State", programStateAccount.publicKey));
//   const mint = await programStateAccount.getTokenMint();
//   const tokenAccount = await spl.createAccount(
//     program.provider.connection,
//     programWallet(program),
//     mint.address,
//     authority.publicKey,
//     web3.Keypair.generate(),
//   );
//
//   // Oracle Queue
//   const queueAccount = await OracleQueueAccount.create(program, {
//     name: Buffer.from("Queue-1"),
//     mint: spl.NATIVE_MINT,
//     slashingEnabled: false,
//     reward: new anchor.BN(0), // no token account needed
//     minStake: new anchor.BN(0),
//     authority: authority.publicKey,
//   });
//   console.log(toAccountString("Oracle Queue", queueAccount.publicKey));
//
//   // Crank
//   const crankAccount = await CrankAccount.create(program, {
//     name: Buffer.from("Crank"),
//     maxRows: 10,
//     queueAccount,
//   });
//   console.log(toAccountString("Crank", crankAccount.publicKey));
//
//   // Oracle
//   const oracleAccount = await OracleAccount.create(program, {
//     name: Buffer.from("Oracle"),
//     queueAccount,
//   });
//   console.log(toAccountString("Oracle", oracleAccount.publicKey));
//
//   // Oracle permissions
//   const oraclePermission = await PermissionAccount.create(program, {
//     authority: authority.publicKey,
//     granter: queueAccount.publicKey,
//     grantee: oracleAccount.publicKey,
//   });
//   await oraclePermission.set({
//     authority,
//     permission: SwitchboardPermission.PERMIT_ORACLE_HEARTBEAT,
//     enable: true,
//   });
//   console.log(toAccountString(`  Permission`, oraclePermission.publicKey));
//   await oracleAccount.heartbeat(authority);
//
//   // Aggregator
//   const aggregatorAccount = await AggregatorAccount.create(program, {
//     name: Buffer.from("SOL_USD"),
//     batchSize: 1,
//     minRequiredOracleResults: 1,
//     minRequiredJobResults: 1,
//     minUpdateDelaySeconds: 10,
//     queueAccount,
//     authority: authority.publicKey,
//   });
//   console.log(`Aggregator (SOL/USD): ${aggregatorAccount.publicKey}`);
//   if (!aggregatorAccount.publicKey) {
//     throw new Error(`failed to read Aggregator publicKey`);
//   }
//
//   // Aggregator permissions
//   const aggregatorPermission = await PermissionAccount.create(program, {
//     authority: authority.publicKey,
//     granter: queueAccount.publicKey,
//     grantee: aggregatorAccount.publicKey,
//   });
//   await aggregatorPermission.set({
//     authority,
//     permission: SwitchboardPermission.PERMIT_ORACLE_QUEUE_USAGE,
//     enable: true,
//   });
//   console.log(toAccountString(`  Permission`, aggregatorPermission.publicKey));
//
//   // Lease
//   const leaseContract = await LeaseAccount.create(program, {
//     loadAmount: new anchor.BN(0),
//     funder: tokenAccount,
//     funderAuthority: authority,
//     oracleQueueAccount: queueAccount,
//     aggregatorAccount,
//   });
//   console.log(toAccountString(`  Lease`, leaseContract.publicKey));
//
//   // Job
//   const tasks: readonly OracleJob.Task[] = [
//     OracleJob.Task.create({
//       httpTask: OracleJob.HttpTask.create({
//         url: `https://ftx.us/api/markets/SOL_USD`,
//       }),
//     }),
//     OracleJob.Task.create({
//       jsonParseTask: OracleJob.JsonParseTask.create({ path: "$.result.price" }),
//     }),
//   ];
//   const jobData = Buffer.from(
//     OracleJob.encodeDelimited(
//       OracleJob.create({
//         tasks,
//       }),
//     ).finish(),
//   );
//   const jobKeypair = web3.Keypair.generate();
//   const jobAccount = await JobAccount.create(program, {
//     data: jobData,
//     keypair: jobKeypair,
//     authority: authority.publicKey,
//   });
//   console.log(toAccountString(`  Job (FTX)`, jobAccount.publicKey));
//
//   await aggregatorAccount.addJob(jobAccount, authority); // Add Job to Aggregator
//   await crankAccount.push({ aggregatorAccount }); // Add Aggregator to Crank
//   async function turnCrank(retryCount: number): Promise<number> {
//     try {
//       const readyPubkeys = await crankAccount.peakNextReady(5);
//       if (readyPubkeys) {
//         const crank = await crankAccount.loadData();
//         const queue = await queueAccount.loadData();
//
//         const crankTurnSignature = await crankAccount.popTxn({
//           payoutWallet: tokenAccount,
//           queuePubkey: queueAccount.publicKey,
//           queueAuthority: queue.authority,
//           readyPubkeys,
//           nonce: 0,
//           crank,
//           queue,
//           tokenMint: mint.address,
//         });
//         await provider.sendAndConfirm(crankTurnSignature);
//         console.log("\u2714 Crank turned");
//         return 0;
//       } else {
//         console.log("\u2716 No feeds ready, exiting");
//         return --retryCount;
//       }
//     } catch {
//       return --retryCount;
//     }
//   }
//   // Might need time for accounts to propagate
//   let retryCount = 3;
//   while (retryCount) {
//     await sleep(3000);
//     retryCount = await turnCrank(retryCount);
//     console.info(`retryCount: ${retryCount}`);
//   }
//
//   // Read Aggregators latest result
//   console.log("######## Aggregator Result ########");
//   await sleep(5000);
//   try {
//     const result = await aggregatorAccount.getLatestValue();
//     console.log(`Result: ${JSON.stringify(result)}\r\n`);
//     console.log(`Aggregator succesfully updated!`);
//   } catch (error: any) {
//     if (error.message === "Aggregator currently holds no value.") {
//       console.log("\u2716 Aggregator holds no value, was the oracle running?");
//       return;
//     }
//     console.error(error);
//   }
// }
async function startSwitchboardWithDevnetQueue() {
  // let switchboard: SwitchboardTestContext;
  const provider = AnchorProvider.env();
  setProvider(provider);
  const authority = (provider.wallet as NodeWallet).payer;
  const DEFAULT_SOL_USD_FEED = new web3.PublicKey(
    "GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR",
  );
  const program = await loadSwitchboardProgram(
    "devnet",
    new Connection(clusterApiUrl("devnet")),
    authority,
  );
  const aggregator = new AggregatorAccount({
    program,
    publicKey: DEFAULT_SOL_USD_FEED,
  });
  // switchboard = await SwitchboardTestContext.loadDevnetQueue(
  //   provider,
  //   "F8ce7MsckeZAbAGmxjJNetxYXQa9mKr9nnrC3qKubyYy"
  // );
  // aggregatorKey = DEFAULT_SOL_USD_FEED;
  // const aggregator = new AggregatorAccount({
  //   program,
  //   publicKey: switchboardFeed,
  // });

  // get the result
  const result = await aggregator.getLatestValue();
  const latestTimestamp = await aggregator.getLatestFeedTimestamp();
  //    Switchboard Result: 30.93671625
  //     currentTimestamp: Mon, 12 Sep 2022 21:42:58 GMT (1663018978511)
  //     latestTimestamp: Tue, 06 Sep 2022 23:45:49 GMT (1662507949)
  console.log(`
    Switchboard Result: ${result}
    currentTimestamp: ${new Date().toUTCString()} (${new Date().getTime()})
    latestTimestamp: ${new Date(latestTimestamp.toNumber() * 1000).toUTCString()} (${latestTimestamp.toNumber()})
  `);
}

void (async () => await startSwitchboardWithDevnetQueue())();
// void (async () => await startSwitchboard2())();

// void (async () => await startSwitchboard())();
// await startSwitchboard();
// void main();
