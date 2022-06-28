import { readFileSync, writeFileSync, existsSync } from "fs";
import {
  PublicKey,
  Keypair,
  Signer,
  ConfirmOptions,
  Connection,
} from "@solana/web3.js";
import {
  getAccount,
  getMint,
  createMint,
  transfer,
  mintTo,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import {
  QuarrySDK,
  QuarryWrapper,
  MinerWrapper,
  findRewarderAddress,
  findMintWrapperAddress,
  findMinterAddress,
  RewarderWrapper,
} from "@quarryprotocol/quarry-sdk";
import * as anchor from "@project-serum/anchor";
import { SolanaProvider } from "@saberhq/solana-contrib";
import { Token, TokenAmount, u64 } from "@saberhq/token-utils";

import { Decimal } from "./src/common";
import {
  assert,
  range,
  secretToKeypair,
  sleep,
  createAssociatedTokenAccount,
  requestAirdrop,
  ensureAccountIsFound,
} from "./src/utils";
import { PoolInstructor } from "./src/poolInstructor";
import { getAssociatedTokenAddress } from "./src/from_ui/solanaUtils";

async function createStableMints(
  connection: Connection,
  payer: Signer,
  decimals: readonly number[],
): Promise<readonly PublicKey[]> {
  return Promise.all(
    decimals.map((dec) =>
      createMint(connection, payer, payer.publicKey, payer.publicKey, dec),
    ),
  );
}

async function createQuarryForPool(
  quarrySDK: QuarrySDK,
  rewarderStateKey: PublicKey,
  poolInstructor: PoolInstructor,
): Promise<QuarryWrapper> {
  const rewarder = await quarrySDK.mine.loadRewarderWrapper(rewarderStateKey);
  const lpToken = Token.fromMint(
    poolInstructor.lpMintKey,
    poolInstructor.lpMintDecimals,
  );
  const pending = await rewarder.createQuarry({ token: lpToken });
  await pending.tx.confirm();
  await ensureAccountIsFound(quarrySDK.provider.connection, pending.quarry);
  return await rewarder.getQuarry(lpToken);
}

async function getQuarryForPool(
  quarrySDK: QuarrySDK,
  rewarderStateKey: PublicKey,
  poolInstructor: PoolInstructor,
): Promise<QuarryWrapper> {
  const rewarder = await quarrySDK.mine.loadRewarderWrapper(rewarderStateKey);
  const lpToken = Token.fromMint(
    poolInstructor.lpMintKey,
    poolInstructor.lpMintDecimals,
  );
  return await rewarder.getQuarry(lpToken);
}

class User {
  constructor(
    readonly connection: Connection,
    readonly payer: Signer,
    readonly poolInstructor: PoolInstructor,
    readonly keypair: Keypair,
    readonly stableKeys: PublicKey[],
    readonly lpKey: PublicKey,
    readonly miner: MinerWrapper,
  ) {}

  static async createAndFund(
    connection: Connection,
    payer: Signer,
    poolInstructor: PoolInstructor,
    quarry: QuarryWrapper,
    funds: number,
    userPair = Keypair.generate(),
  ) {
    await requestAirdrop(connection, userPair.publicKey);

    const stableKeys = await Promise.all(
      range(poolInstructor.tokenCount).map(async (i) => {
        const mintKey = poolInstructor.tokenMintKeys[i];
        const mintDecimals = poolInstructor.tokenDecimals[i];
        const userATA = await getOrCreateAssociatedTokenAccount(
          connection,
          payer,
          mintKey,
          userPair.publicKey,
        );
        const userATAKey = userATA.address;
        await mintTo(
          connection,
          payer,
          mintKey,
          userATAKey,
          payer,
          BigInt(funds) * BigInt(10 ** mintDecimals),
        );
        return userATAKey;
      }),
    );
    const lpKey = await createAssociatedTokenAccount(
      connection,
      payer,
      poolInstructor.lpMintKey,
      userPair.publicKey,
    );

    const pendingMiner = await quarry.createMiner({
      authority: userPair.publicKey,
    });
    await pendingMiner.tx.addSigners(userPair).confirm();
    await ensureAccountIsFound(connection, pendingMiner.miner);

    return new User(
      connection,
      payer,
      poolInstructor,
      userPair,
      stableKeys,
      lpKey,
      pendingMiner.wrapper,
    );
  }

  static async load(
    connection: Connection,
    payer: Signer,
    poolInstructor: PoolInstructor,
    quarry: QuarryWrapper,
    userPair: Keypair,
  ): Promise<User> {
    const stableKeys = poolInstructor.tokenMintKeys.map((mint) =>
      getAssociatedTokenAddress(mint, userPair.publicKey),
    );
    const lpKey = getAssociatedTokenAddress(
      poolInstructor.lpMintKey,
      userPair.publicKey,
    );
    const miner = await quarry.getMinerActions(userPair.publicKey);
    return new User(
      connection,
      payer,
      poolInstructor,
      userPair,
      stableKeys,
      lpKey,
      miner,
    );
  }

  async add(amounts: Decimal[], minMintAmount = new Decimal(0)) {
    await this.poolInstructor.add(
      amounts,
      minMintAmount,
      this.stableKeys,
      this.lpKey,
      this.keypair,
    );
  }

  async getLpBalance(): Promise<bigint> {
    return (await getAccount(this.connection, this.lpKey)).amount;
  }

  async getStakedBalance(): Promise<bigint> {
    return (
      await getAccount(
        this.connection,
        (
          await this.miner.fetchData()
        ).tokenVaultKey,
      )
    ).amount;
  }

  async stake(amount: bigint) {
    const lpToken = Token.fromMint(
      this.poolInstructor.lpMintKey,
      this.poolInstructor.lpMintDecimals,
    );
    await this.miner
      .stake(new TokenAmount(lpToken, amount))
      .addSigners(this.keypair)
      .confirm();
  }

  async unstake(amount: bigint) {
    const lpToken = Token.fromMint(
      this.poolInstructor.lpMintKey,
      this.poolInstructor.lpMintDecimals,
    );
    await this.miner
      .withdraw(new TokenAmount(lpToken, amount))
      .addSigners(this.keypair)
      .confirm();
  }
}

class RewarderSetup {
  constructor(
    readonly rewarder: RewarderWrapper,
    readonly hardcap: number,
    readonly minterKey: PublicKey,
    readonly redeemerTokenKey: PublicKey,
  ) {}

  get rewarderKey(): PublicKey {
    return this.rewarder.rewarderKey;
  }

  get mintWrapperKey(): PublicKey {
    return this.rewarder.rewarderData.mintWrapper;
  }

  get iouMintKey(): PublicKey {
    return this.rewarder.rewarderData.rewardsTokenMint;
  }

  static async create(
    quarrySDK: QuarrySDK,
    payer: Signer,
    hardcap: number,
    governanceTokenKey: PublicKey,
  ): Promise<RewarderSetup> {
    assert(quarrySDK.provider.walletKey.equals(payer.publicKey));
    const { connection } = quarrySDK.provider;

    const governanceTokenAccount = await getAccount(
      connection,
      governanceTokenKey,
    );
    assert(governanceTokenAccount.owner.equals(payer.publicKey));
    const governanceMintKey = governanceTokenAccount.mint;
    const governanceMint = await getMint(connection, governanceMintKey);
    const hardcapAtomic = new u64(hardcap).muln(10 ** governanceMint.decimals);
    assert(governanceTokenAccount.amount >= BigInt(hardcapAtomic.toString()));

    const mintWrapperPair = Keypair.generate();
    const [mintWrapperKey] = await findMintWrapperAddress(
      mintWrapperPair.publicKey,
    );
    const iouMintKey = await createMint(
      connection,
      payer,
      mintWrapperKey,
      mintWrapperKey,
      governanceMint.decimals,
    );
    console.log(`deployed iouMint: ${iouMintKey}`);

    {
      const { mintWrapper, tx } = await quarrySDK.mintWrapper.newWrapper({
        baseKP: mintWrapperPair,
        hardcap: hardcapAtomic,
        tokenMint: iouMintKey,
        admin: payer.publicKey, //this is the default option, but better to make it explict because you'd think you have to make the rewarder admin of the MintWrapper, but no!
      });
      assert(mintWrapper.equals(mintWrapperKey));
      await tx.confirm();
      await ensureAccountIsFound(connection, mintWrapperKey);
      console.log(`deployed mintWrapper: ${mintWrapperKey.toString()}`);
    }

    await (
      await quarrySDK.mintWrapper.newMinterWithAllowance(
        mintWrapperKey,
        payer.publicKey,
        hardcapAtomic,
      )
    ).confirm();
    const [minterKey] = await findMinterAddress(
      mintWrapperKey,
      payer.publicKey,
    );
    console.log(
      `deployed minter: ${minterKey} with (atomic) allowance: ${hardcapAtomic.toString()}`,
    );

    const rewarderPair = Keypair.generate();
    const [rewarderKey] = await findRewarderAddress(rewarderPair.publicKey);
    {
      const { key, tx } = await quarrySDK.mine.createRewarder({
        baseKP: rewarderPair,
        mintWrapper: mintWrapperKey,
        authority: payer.publicKey,
      });
      assert(key.equals(rewarderKey));
      await tx.confirm();
      await ensureAccountIsFound(connection, rewarderKey);
      console.log(`deployed rewarder: ${rewarderKey}`);
    }
    const rewarder = await quarrySDK.mine.loadRewarderWrapper(rewarderKey);

    const redeemerTokenKey = await (async () => {
      const { vaultTokenAccount, tx } = await quarrySDK.createRedeemer({
        iouMint: iouMintKey,
        redemptionMint: governanceMintKey,
      });
      await tx.confirm();
      await ensureAccountIsFound(connection, vaultTokenAccount);
      console.log(`deployed redeemer, redeemerTokenKey: ${vaultTokenAccount}`);
      return vaultTokenAccount;
    })();

    await transfer(
      connection,
      payer,
      governanceTokenKey,
      redeemerTokenKey,
      payer,
      hardcapAtomic,
    );

    return new RewarderSetup(rewarder, hardcap, minterKey, redeemerTokenKey);
  }

  static async fromObject(
    quarrySDK: QuarrySDK,
    obj: any,
  ): Promise<RewarderSetup> {
    return new RewarderSetup(
      await quarrySDK.mine.loadRewarderWrapper(new PublicKey(obj.rewarderKey)),
      obj.hardcap,
      new PublicKey(obj.minterKey),
      new PublicKey(obj.redeemerTokenKey),
    );
  }

  toObject(): any {
    return {
      rewarderKey: this.rewarderKey.toString(),
      hardcap: this.hardcap,
      minterKey: this.minterKey.toString(),
      redeemerTokenKey: this.redeemerTokenKey.toString(),
    };
  }
}

class FullSetup {
  constructor(
    readonly quarrySDK: QuarrySDK,
    readonly payer: Signer,
    readonly swimMintKey: PublicKey,
    readonly swimMintDecimals: number,
    readonly poolInstructor: PoolInstructor,
    readonly rewarderSetup: RewarderSetup,
    readonly quarry: QuarryWrapper,
    public users: User[] = [],
  ) {}

  get connection(): Connection {
    return this.quarrySDK.provider.connection;
  }

  get rewarder(): RewarderWrapper {
    return this.rewarderSetup.rewarder;
  }

  get rewarderKey(): PublicKey {
    return this.rewarderSetup.rewarderKey;
  }

  get mintWrapperKey(): PublicKey {
    return this.rewarderSetup.mintWrapperKey;
  }

  get iouMintKey(): PublicKey {
    return this.rewarderSetup.iouMintKey;
  }

  static async create(
    quarrySDK: QuarrySDK,
    payer: Signer,
    swimMintDecimals = 6,
    stableMintDecimals = [6, 6, 6, 6, 8, 8],
    hardcap = 100,
    ampFactor = new Decimal(1),
    lpFee = new Decimal("0.0003"),
    governanceFee = new Decimal("0.0001"),
  ): Promise<FullSetup> {
    assert(quarrySDK.provider.walletKey.equals(payer.publicKey));
    const { connection } = quarrySDK.provider;

    const swimMintKey = await createMint(
      connection,
      payer,
      payer.publicKey,
      payer.publicKey,
      swimMintDecimals,
    );
    console.log(`deployed swimMint: ${swimMintKey}`);
    const stableMintKeys = await createStableMints(
      connection,
      payer,
      stableMintDecimals,
    );
    console.log(`deployed stableMints: ${stableMintKeys}`);
    await Promise.all(
      stableMintKeys.map((mintKey) => getMint(connection, mintKey)),
    );

    const swimPremined = BigInt(hardcap) * BigInt(10 ** swimMintDecimals);
    const payerSwimKey = await createAssociatedTokenAccount(
      connection,
      payer,
      swimMintKey,
      payer.publicKey,
    );
    await mintTo(
      connection,
      payer,
      swimMintKey,
      payerSwimKey,
      payer,
      swimPremined,
    );
    console.log(`minted ${swimPremined} premined swim to ${payerSwimKey}`);

    const lpDecimals = Math.max(...stableMintDecimals);
    const poolInstructor = await PoolInstructor.deployPool(
      connection,
      payer,
      stableMintKeys,
      payer.publicKey,
      lpDecimals,
      ampFactor,
      lpFee,
      governanceFee,
    );
    console.log(`deployed pool: ${poolInstructor.stateKey}`);

    const rewarderSetup = await RewarderSetup.create(
      quarrySDK,
      payer,
      hardcap,
      payerSwimKey,
    );
    const { rewarderKey } = rewarderSetup;

    const quarry = await createQuarryForPool(
      quarrySDK,
      rewarderKey,
      poolInstructor,
    );
    console.log(`deployed quarry: ${quarry.key}`);

    return new FullSetup(
      quarrySDK,
      payer,
      swimMintKey,
      swimMintDecimals,
      poolInstructor,
      rewarderSetup,
      quarry,
    );
  }

  async newUser(funds: number, userPair = Keypair.generate()) {
    this.users.push(
      await User.createAndFund(
        this.connection,
        this.payer,
        this.poolInstructor,
        this.quarry,
        funds,
        userPair,
      ),
    );
    console.log(
      `deployed user ${this.users[
        this.users.length - 1
      ].keypair.publicKey.toString()} and funded SOL and ${funds} tokens from each stable mint`,
    );
  }

  writeToFile(filename: string) {
    const obj = {
      swimMintKey: this.swimMintKey.toString(),
      swimMintDecimals: this.swimMintDecimals,
      poolKey: this.poolInstructor.stateKey.toString(),
      rewarderSetup: this.rewarderSetup.toObject(),
      quarry: this.quarry.key.toString(),
      users: this.users.map((user) => [
        user.keypair.publicKey.toBuffer().toJSON(),
        Buffer.from(user.keypair.secretKey).toJSON(),
      ]),
    };

    writeFileSync(filename, JSON.stringify(obj, null, 2));
  }

  static async readFromFile(
    quarrySDK: QuarrySDK,
    payer: Signer,
    filename: string,
  ): Promise<FullSetup> {
    const { connection } = quarrySDK.provider;

    const obj = JSON.parse(readFileSync(filename, "utf-8"));
    const swimMintKey = new PublicKey(obj.swimMintKey);
    const swimMintDecimals = obj.swimMintDecimals;
    const poolInstructor = await PoolInstructor.fromStateKey(
      connection,
      payer,
      new PublicKey(obj.poolKey),
    );
    const rewarderSetup = await RewarderSetup.fromObject(
      quarrySDK,
      obj.rewarderSetup,
    );
    const quarry = await getQuarryForPool(
      quarrySDK,
      rewarderSetup.rewarderKey,
      poolInstructor,
    );

    const toKeypair = (pair: string[]) =>
      new Keypair({
        publicKey: Buffer.from(pair[0]),
        secretKey: Buffer.from(pair[1]),
      });

    const userPairs: Keypair[] =
      obj?.users.map((pair) => toKeypair(pair)) ?? [];
    const users = await Promise.all(
      userPairs.map((kp) =>
        User.load(connection, payer, poolInstructor, quarry, kp),
      ),
    );

    return new FullSetup(
      quarrySDK,
      payer,
      swimMintKey,
      swimMintDecimals,
      poolInstructor,
      rewarderSetup,
      quarry,
      users,
    );
  }
}

async function main() {
  const config = JSON.parse(readFileSync("config.json", "utf-8"));
  const payer = secretToKeypair(
    JSON.parse(readFileSync(config.walletSecretJsonFile, "utf-8")),
  );
  const wallet = new anchor.Wallet(payer);
  const confirmOptions: ConfirmOptions = {
    commitment: "finalized",
    preflightCommitment: "finalized",
  };
  const connection = new Connection(config.rpcUrl, confirmOptions);

  const quarrySDK = (() => {
    const anchorProvider = new anchor.Provider(
      connection,
      wallet,
      confirmOptions,
    );
    anchor.setProvider(anchorProvider);
    return QuarrySDK.load({
      provider: SolanaProvider.load({
        connection: anchorProvider.connection,
        sendConnection: anchorProvider.connection,
        wallet: anchorProvider.wallet,
        opts: anchorProvider.opts,
      }),
    });
  })();

  await requestAirdrop(connection, payer.publicKey);

  let setups = [
    await (async (filename: string) => {
      if (existsSync(filename))
        return await FullSetup.readFromFile(quarrySDK, payer, filename);

      const setup = await FullSetup.create(quarrySDK, payer);
      await setup.newUser(10);
      await setup.newUser(10);
      setup.writeToFile(filename);
      return setup;
    })("full_setup.json"),
  ];

  setups.push(
    await (async (filename: string) => {
      if (existsSync(filename))
        return await FullSetup.readFromFile(quarrySDK, payer, filename);

      const setup = setups[0];
      const { ampFactor, lpFee, governanceFee } =
        await setup.poolInstructor.getState();
      const poolInstructor = await PoolInstructor.deployPool(
        connection,
        payer,
        setup.poolInstructor.tokenMintKeys,
        payer.publicKey,
        setup.poolInstructor.lpMintDecimals,
        ampFactor.targetValue,
        lpFee,
        governanceFee,
      );
      console.log(`deployed pool: ${poolInstructor.stateKey}`);

      const quarry = await createQuarryForPool(
        quarrySDK,
        setup.rewarderKey,
        poolInstructor,
      );
      console.log(`deployed quarry: ${quarry.key}`);

      const partiallyCopiedSetup = new FullSetup(
        quarrySDK,
        payer,
        setup.swimMintKey,
        setup.swimMintDecimals,
        poolInstructor,
        setup.rewarderSetup,
        quarry,
      );
      await partiallyCopiedSetup.newUser(10, setup.users[0].keypair);
      await partiallyCopiedSetup.newUser(10, setup.users[1].keypair);
      partiallyCopiedSetup.writeToFile(filename);

      return partiallyCopiedSetup;
    })("full_setup2.json"),
  );

  //console.log(await getAccount(connection, setup.users[0].stableKeys[0]));

  const addAndStake = async (
    setupIndex: number,
    userIndex: number,
    amount: number,
  ) => {
    const setup = setups[setupIndex];
    const user = setup.users[userIndex];
    console.log(`user ${userIndex} for setup ${setupIndex} ...`);
    if (amount > 0) {
      await user.add(
        range(setup.poolInstructor.tokenCount).map((_) => new Decimal(amount)),
      );
      console.log(
        `... added ${amount} (human) stable token each to the pool and ...`,
      );
    }

    const lpBalance = await user.getLpBalance();
    await user.stake(lpBalance);
    console.log(`... staked their ${lpBalance} (atomic) lp tokens`);
  };

  const unstake = async (
    setupIndex: number,
    userIndex: number,
    amount: bigint,
  ) => {
    const setup = setups[setupIndex];
    const user = setup.users[userIndex];
    await user.unstake(amount);
    console.log(
      `user ${userIndex} for setup ${setupIndex} unstaked ${amount} (atomic) lp tokens`,
    );
  };

  const sleepFor = async (seconds: number) => {
    console.log(`now sleeping for ${seconds} seconds...`);
    await sleep(seconds);
    console.log(`*yawn* refreshing!`);
  };

  await addAndStake(1, 0, 0);
  await sleepFor(90);
  await addAndStake(1, 1, 0);

  // await unstake(1, 0, await setups[1].users[0].getStakedBalance());
  // await sleepFor(90);
  // await unstake(1, 1, await setups[1].users[1].getStakedBalance());

  // await addAndStake(0, 1);
  // await sleepFor(60);
  // await addAndStake(1, 5);
  // await sleepFor(60);
  // await addAndStake(0, 2);
  // await sleepFor(300);
  // await unstake(1, userStaked[1]);
  // await sleepFor(60);
  // await unstake(0, userStaked[0]);
  // await sleepFor(60);

  // //we actually only care about it being nonzero so the airdrop script knows where to stop parsing
  // const rewardRate = 52n * BigInt(setup.rewarderSetup.hardcap) * 10n ** BigInt(setup.swimMintDecimals);
  // const setNsync = await setup.rewarder.setAndSyncAnnualRewards(new u64(rewardRate.toString()), [setup.poolInstructor.lpMintKey]);
  // await setNsync.confirm();

  console.log("done");
}

main();
