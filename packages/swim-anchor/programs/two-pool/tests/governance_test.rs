#![cfg(feature = "test-bpf")]

// use anchor_spl::associated_token::instruction as associated_token_instruction;
use {
    crate::spl_token::{solana_program::program_pack::Pack, state::Mint},
    anchor_client::{
        solana_client::client_error::ClientError,
        solana_sdk::{
            account::Account,
            clock::Clock,
            commitment_config::{CommitmentConfig, CommitmentLevel},
            hash::Hash,
            instruction::{Instruction, InstructionError},
            pubkey::Pubkey,
            rent::*,
            signature::{Keypair, Signer},
            system_instruction::{self, create_account},
            sysvar::SysvarId,
            transaction::{Transaction, TransactionError},
        },
        Client, Cluster, Program,
    },
    anchor_lang::{AccountDeserialize, Id},
    anchor_spl::{
        associated_token::get_associated_token_address,
        token::{spl_token, spl_token::instruction},
    },
    solana_program_test::{tokio, BanksClient, BanksClientError, ProgramTest, ProgramTestContext},
    spl_associated_token_account::instruction as associated_token_instruction,
    std::rc::Rc,
    two_pool::{
        amp_factor::AmpFactor,
        instructions::{
            InitializeParams, PrepareFeeChangeParams, PrepareGovernanceTransition, ENACT_DELAY,
        },
        pool_fee::PoolFee,
        state::TwoPool,
        DecimalU64Anchor,
    },
};

#[tokio::test]
async fn test_governance_transition() {
    let mut pt = ProgramTest::new("two_pool", two_pool::id(), None);

    let pt_ctxt = &mut DeployedPoolProgramTestContext::new(pt).await;

    let client = Client::new_with_options(
        Cluster::Debug,
        Rc::new(copy_keypair(pt_ctxt.get_payer())),
        CommitmentConfig::finalized(),
    );
    let program = client.program(two_pool::id());
    pt_ctxt.initialize_pool(&program).await.unwrap();

    let pool_state_account = pt_ctxt.get_pool_state_data(pt_ctxt.pool_key).await;
    let pool_state: TwoPool =
        TwoPool::try_deserialize(&mut pool_state_account.data.as_slice()).unwrap();
    assert_eq!(pool_state.prepared_governance_key, Pubkey::default());
    let governance_transition_ts = pool_state.governance_transition_ts;
    assert_eq!(governance_transition_ts, 0i64);

    let new_governance_key = Keypair::new();

    let prepare_gov_transition_ix = program
        .request()
        .accounts(two_pool::accounts::PrepareGovernanceTransition {
            common_governance: two_pool::accounts::CommonGovernance {
                pool: pt_ctxt.pool_key,
                governance: pt_ctxt.get_governance().pubkey(),
            },
        })
        .args(two_pool::instruction::PrepareGovernanceTransition {
            upcoming_governance_key: new_governance_key.pubkey(),
        })
        .instructions()
        .unwrap()
        .pop()
        .unwrap();

    let recent_blockhash = pt_ctxt.get_latest_blockhash().await;

    let prepare_gov_transition_txn = Transaction::new_signed_with_payer(
        &[prepare_gov_transition_ix],
        Some(&pt_ctxt.get_payer().pubkey()),
        &[pt_ctxt.get_payer(), pt_ctxt.get_governance()],
        recent_blockhash,
    );

    pt_ctxt
        .process_transaction(prepare_gov_transition_txn)
        .await
        .unwrap();

    let pool_state_account = pt_ctxt.get_pool_state_data(pt_ctxt.pool_key).await;
    let pool_state: TwoPool =
        TwoPool::try_deserialize(&mut pool_state_account.data.as_slice()).unwrap();

    let governance_transition_ts_after = pool_state.governance_transition_ts;
    assert_eq!(
        pool_state.prepared_governance_key,
        new_governance_key.pubkey()
    );
    assert!(governance_transition_ts_after >= ENACT_DELAY);

    let enact_gov_transition_ix = program
        .request()
        .accounts(two_pool::accounts::EnactGovernanceTransition {
            common_governance: two_pool::accounts::CommonGovernance {
                pool: pt_ctxt.pool_key,
                governance: pt_ctxt.get_governance().pubkey(),
            },
        })
        .args(two_pool::instruction::EnactGovernanceTransition {})
        .instructions()
        .unwrap()
        .pop()
        .unwrap();

    let recent_blockhash = pt_ctxt.get_latest_blockhash().await;

    let enact_gov_transition_txn = Transaction::new_signed_with_payer(
        &[enact_gov_transition_ix.clone()],
        Some(&pt_ctxt.get_payer().pubkey()),
        &[pt_ctxt.get_payer(), pt_ctxt.get_governance()],
        recent_blockhash,
    );

    pt_ctxt
        .process_transaction(enact_gov_transition_txn)
        .await
        .expect_err("enact governance transition should fail");

    //verify that nothing changed

    let pool_state_account = pt_ctxt.get_pool_state_data(pt_ctxt.pool_key).await;
    let pool_state: TwoPool =
        TwoPool::try_deserialize(&mut pool_state_account.data.as_slice()).unwrap();

    assert_eq!(
        pool_state.prepared_governance_key,
        new_governance_key.pubkey()
    );
    assert_eq!(
        pool_state.governance_transition_ts,
        governance_transition_ts_after
    );

    pt_ctxt.time_travel(ENACT_DELAY * 3).await;

    let recent_blockhash = pt_ctxt.get_latest_blockhash().await;

    let enact_gov_transition_txn = Transaction::new_signed_with_payer(
        &[enact_gov_transition_ix],
        Some(&pt_ctxt.get_payer().pubkey()),
        &[pt_ctxt.get_payer(), pt_ctxt.get_governance()],
        recent_blockhash,
    );

    pt_ctxt
        .process_transaction(enact_gov_transition_txn)
        .await
        .unwrap();

    let pool_state_account = pt_ctxt.get_pool_state_data(pt_ctxt.pool_key).await;
    let pool_state: TwoPool =
        TwoPool::try_deserialize(&mut pool_state_account.data.as_slice()).unwrap();
    assert_eq!(pool_state.governance_key, new_governance_key.pubkey());
    assert_eq!(pool_state.prepared_governance_key, Pubkey::default());
    assert_eq!(pool_state.governance_transition_ts, 0i64);
}

#[tokio::test]
async fn test_fee_change() {
    let mut pt = ProgramTest::new("two_pool", two_pool::id(), None);

    let pt_ctxt = &mut DeployedPoolProgramTestContext::new(pt).await;

    let client = Client::new_with_options(
        Cluster::Debug,
        Rc::new(copy_keypair(pt_ctxt.get_payer())),
        CommitmentConfig::finalized(),
    );
    let program = client.program(two_pool::id());
    pt_ctxt.initialize_pool(&program).await.unwrap();

    let pool_state_account = pt_ctxt.get_pool_state_data(pt_ctxt.pool_key).await;
    let pool_state: TwoPool =
        TwoPool::try_deserialize(&mut pool_state_account.data.as_slice()).unwrap();
    assert_eq!(pool_state.prepared_governance_key, Pubkey::default());
    let fee_transition_ts = pool_state.fee_transition_ts;
    assert_eq!(fee_transition_ts, 0i64);

    let lp_fee = DecimalU64Anchor {
        value: 400u64,
        decimals: 6u8,
    };
    let governance_fee = DecimalU64Anchor {
        value: 200u64,
        decimals: 6u8,
    };

    let prepare_gov_transition_ix = program
        .request()
        .accounts(two_pool::accounts::PrepareFeeChange {
            common_governance: two_pool::accounts::CommonGovernance {
                pool: pt_ctxt.pool_key,
                governance: pt_ctxt.get_governance().pubkey(),
            },
        })
        .args(two_pool::instruction::PrepareFeeChange {
            lp_fee,
            governance_fee,
            // params: PrepareFeeChangeParams {
            //     lp_fee,
            //     governance_fee,
            // },
        })
        .instructions()
        .unwrap()
        .pop()
        .unwrap();

    let recent_blockhash = pt_ctxt.get_latest_blockhash().await;

    let prepare_gov_transition_txn = Transaction::new_signed_with_payer(
        &[prepare_gov_transition_ix],
        Some(&pt_ctxt.get_payer().pubkey()),
        &[pt_ctxt.get_payer(), pt_ctxt.get_governance()],
        recent_blockhash,
    );

    pt_ctxt
        .process_transaction(prepare_gov_transition_txn)
        .await
        .unwrap();

    let pool_state_account = pt_ctxt.get_pool_state_data(pt_ctxt.pool_key).await;
    let pool_state: TwoPool =
        TwoPool::try_deserialize(&mut pool_state_account.data.as_slice()).unwrap();

    let fee_transition_ts_after = pool_state.fee_transition_ts;
    assert_eq!(
        pool_state.prepared_lp_fee,
        PoolFee::new(lp_fee.into()).unwrap()
    );
    assert_eq!(
        pool_state.prepared_governance_fee,
        PoolFee::new(governance_fee.into()).unwrap()
    );
    assert!(fee_transition_ts_after >= ENACT_DELAY);

    let enact_fee_change_ix = program
        .request()
        .accounts(two_pool::accounts::EnactFeeChange {
            common_governance: two_pool::accounts::CommonGovernance {
                pool: pt_ctxt.pool_key,
                governance: pt_ctxt.get_governance().pubkey(),
            },
        })
        .args(two_pool::instruction::EnactFeeChange {})
        .instructions()
        .unwrap()
        .pop()
        .unwrap();

    let recent_blockhash = pt_ctxt.get_latest_blockhash().await;

    let enact_fee_change_txn = Transaction::new_signed_with_payer(
        &[enact_fee_change_ix.clone()],
        Some(&pt_ctxt.get_payer().pubkey()),
        &[pt_ctxt.get_payer(), pt_ctxt.get_governance()],
        recent_blockhash,
    );

    pt_ctxt
        .process_transaction(enact_fee_change_txn)
        .await
        .expect_err("enact governance transition should fail");

    //verify that nothing changed

    let pool_state_account = pt_ctxt.get_pool_state_data(pt_ctxt.pool_key).await;
    let pool_state: TwoPool =
        TwoPool::try_deserialize(&mut pool_state_account.data.as_slice()).unwrap();

    assert_eq!(
        pool_state.prepared_lp_fee,
        PoolFee::new(lp_fee.into()).unwrap()
    );
    assert_eq!(
        pool_state.prepared_governance_fee,
        PoolFee::new(governance_fee.into()).unwrap()
    );

    pt_ctxt.time_travel(ENACT_DELAY * 3).await;

    let recent_blockhash = pt_ctxt.get_latest_blockhash().await;

    let enact_gov_transition_txn = Transaction::new_signed_with_payer(
        &[enact_fee_change_ix],
        Some(&pt_ctxt.get_payer().pubkey()),
        &[pt_ctxt.get_payer(), pt_ctxt.get_governance()],
        recent_blockhash,
    );

    pt_ctxt
        .process_transaction(enact_gov_transition_txn)
        .await
        .unwrap();

    let pool_state_account = pt_ctxt.get_pool_state_data(pt_ctxt.pool_key).await;
    let pool_state: TwoPool =
        TwoPool::try_deserialize(&mut pool_state_account.data.as_slice()).unwrap();
    assert_eq!(pool_state.lp_fee, PoolFee::new(lp_fee.into()).unwrap());
    assert_eq!(
        pool_state.governance_fee,
        PoolFee::new(governance_fee.into()).unwrap()
    );
    assert_eq!(pool_state.prepared_lp_fee, PoolFee::default());
    assert_eq!(pool_state.prepared_governance_fee, PoolFee::default());
    assert_eq!(pool_state.fee_transition_ts, 0i64);
}

async fn create_mint(context: &mut ProgramTestContext, decimals: u8) -> Keypair {
    let mint_account = Keypair::new();
    let token_mint_address = mint_account.pubkey();
    let space = Mint::LEN;
    let rent = context.banks_client.get_rent().await.unwrap();
    let program_id = &spl_token::id();
    let mint_authority = &context.payer;
    let transaction = Transaction::new_signed_with_payer(
        &[
            create_account(
                &context.payer.pubkey(),
                &mint_account.pubkey(),
                rent.minimum_balance(space),
                space as u64,
                program_id,
            ),
            instruction::initialize_mint(
                program_id,
                &token_mint_address,
                &mint_authority.pubkey(),
                Some(&mint_authority.pubkey()),
                decimals,
            )
            .unwrap(),
        ],
        Some(&context.payer.pubkey()),
        &[&context.payer, &mint_account],
        context.last_blockhash,
    );
    context
        .banks_client
        .process_transaction(transaction)
        .await
        .unwrap();

    mint_account
}

async fn create_associated_token_account(
    context: &mut ProgramTestContext,
    owner: &Pubkey,
    mint: &Pubkey,
) -> Pubkey {
    let transaction = Transaction::new_signed_with_payer(
        &[
            associated_token_instruction::create_associated_token_account(
                &context.payer.pubkey(),
                owner,
                mint,
            ),
        ],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );
    context
        .banks_client
        .process_transaction(transaction)
        .await
        .unwrap();

    get_associated_token_address(owner, mint)
}

fn copy_keypair(keypair: &Keypair) -> Keypair {
    Keypair::from_bytes(&keypair.to_bytes()).unwrap()
}

pub struct DeployedPoolProgramTestContext {
    pt_ctxt: ProgramTestContext,
    pool_key: Pubkey,
    governance: Keypair,
    pool_mints: [Keypair; 2],
    lp_mint: Keypair,
    pause_key: Keypair,
}

impl DeployedPoolProgramTestContext {
    pub async fn new(mut pt: ProgramTest) -> Self {
        let mut pt_ctxt: ProgramTestContext = pt.start_with_context().await;

        let usdc_mint_keypair = create_mint(&mut pt_ctxt, 6u8).await;
        let usdt_mint_keypair = create_mint(&mut pt_ctxt, 6u8).await;
        let swim_usd_keypair = Keypair::new();
        let governance = Keypair::new();
        let pause_key = Keypair::new();
        let (pool_key, bump) = Pubkey::find_program_address(
            &[
                b"two_pool".as_ref(),
                &usdc_mint_keypair.pubkey().to_bytes(),
                &usdt_mint_keypair.pubkey().to_bytes(),
                &swim_usd_keypair.pubkey().to_bytes(),
            ],
            &two_pool::id(),
        );

        Self {
            pt_ctxt,
            pool_key,
            governance,
            pool_mints: [usdc_mint_keypair, usdt_mint_keypair],
            lp_mint: swim_usd_keypair,
            pause_key,
        }
    }

    pub async fn initialize_pool(&mut self, program: &Program) -> Result<(), BanksClientError> {
        // let governance = Keypair::new();
        let usdc_mint_keypair = copy_keypair(&self.pool_mints[0]);
        let usdt_mint_keypair = copy_keypair(&self.pool_mints[1]);
        let lp_mint_keypair = copy_keypair(&self.lp_mint);
        let (pool_key, bump) = Pubkey::find_program_address(
            &[
                b"two_pool".as_ref(),
                &usdc_mint_keypair.pubkey().to_bytes(),
                &usdt_mint_keypair.pubkey().to_bytes(),
                &lp_mint_keypair.pubkey().to_bytes(),
            ],
            &two_pool::id(),
        );
        let pool_usdc_ata_addr =
            get_associated_token_address(&pool_key, &usdc_mint_keypair.pubkey());
        let pool_usdt_ata_addr =
            get_associated_token_address(&pool_key, &usdt_mint_keypair.pubkey());
        let governance_fee_addr = get_associated_token_address(
            &self.get_governance().pubkey(),
            &lp_mint_keypair.pubkey(),
        );

        let amp_factor = DecimalU64Anchor {
            value: 300u64,
            decimals: 0u8,
        };
        let lp_fee = DecimalU64Anchor {
            value: 300u64,
            decimals: 6u8,
        };
        let governance_fee = DecimalU64Anchor {
            value: 100u64,
            decimals: 6u8,
        };

        let init_ix = program
            .request()
            .accounts(two_pool::accounts::Initialize {
                pool: pool_key,
                payer: self.get_payer().pubkey(),
                pool_mint_0: usdc_mint_keypair.pubkey(),
                pool_mint_1: usdt_mint_keypair.pubkey(),
                lp_mint: lp_mint_keypair.pubkey(),
                pool_token_account_0: pool_usdc_ata_addr,
                pool_token_account_1: pool_usdt_ata_addr,
                pause_key: self.get_pause_key().pubkey(),
                governance_account: self.get_governance().pubkey(),
                governance_fee_account: governance_fee_addr,
                token_program: spl_token::id(),
                associated_token_program: spl_associated_token_account::id(),
                system_program: anchor_lang::prelude::System::id(),
                rent: anchor_lang::prelude::Rent::id(),
            })
            .args(two_pool::instruction::Initialize {
                // params: InitializeParams {
                //     amp_factor,
                //     lp_fee,
                //     governance_fee,
                // },
                amp_factor,
                lp_fee,
                governance_fee,
            })
            .instructions()
            .unwrap()
            .pop()
            .unwrap();

        let recent_blockhash = self.get_latest_blockhash().await;

        let init_txn = Transaction::new_signed_with_payer(
            &[init_ix],
            Some(&self.get_payer().pubkey()),
            &[self.get_payer(), &self.lp_mint],
            recent_blockhash,
        );

        self.process_transaction(init_txn).await
    }

    pub fn get_payer(&self) -> &Keypair {
        &self.pt_ctxt.payer
    }

    pub fn get_governance(&self) -> &Keypair {
        &self.governance
    }

    pub fn get_pause_key(&self) -> &Keypair {
        &self.pause_key
    }

    pub async fn get_pool_state_data(&mut self, pool_key: Pubkey) -> Account {
        self.pt_ctxt
            .banks_client
            .get_account(pool_key)
            .await
            .unwrap()
            .unwrap()
    }

    async fn get_latest_blockhash(&mut self) -> Hash {
        self.pt_ctxt
            .banks_client
            .get_latest_blockhash()
            .await
            .unwrap()
    }

    pub async fn process_transaction(
        &mut self,
        transaction: Transaction,
    ) -> Result<(), BanksClientError> {
        self.pt_ctxt
            .banks_client
            .process_transaction(transaction)
            .await
    }

    // Time-travel
    // Note: in order to "time-travel", must also warp to future slot.
    //  not 100% sure why might be something to do with the blockhash being the same.
    pub async fn time_travel(&mut self, time_skip_amount: i64) {
        let mut clock_sysvar = self
            .pt_ctxt
            .banks_client
            .get_sysvar::<Clock>()
            .await
            .unwrap();
        let current_ts = clock_sysvar.unix_timestamp;
        let timeskip_ts = current_ts + time_skip_amount;
        clock_sysvar.unix_timestamp = timeskip_ts;
        self.pt_ctxt.set_sysvar::<Clock>(&clock_sysvar);

        let current_slot = self.pt_ctxt.banks_client.get_root_slot().await.unwrap();
        self.pt_ctxt.warp_to_slot(current_slot + 1).unwrap();
    }
}
