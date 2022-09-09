# Deployment

** VERY IMPORTANT **

1. since we're using rust `#[cfg]` features to conditionally determine which wormhole/tokenbridge
   addresses should be used (since they're different between mainnet, devnet and localnet), you must build for
   environment and deployment separately

```
# building for localnet testing
anchor build -- --features localnet
anchor deploy

# building for devnet
anchor build -- --features devnet
anchor deploy

# building for mainnet
anchor build -- --features mainnet
anchor deploy
```

1. switchboard default is mainnet address
2.

# To Do:

1. mappings
    1. tokenIdMapping: mapping(tokenId: uint16 => (tokenContract: address, poolOnThisChain: address, tokenIndexInPool: uint8))
    2. tokenAddressMapping: mapping(tokenContract: address => (tokenId: uint16, poolOnThisChain: address, tokenIndexInPool: uint8)
2. add bypass if user calls propellerEnabled complete/process swim payload to skip fee conversions
3. add routing contract pause

## transactions

1. Complete on Solana
    1. [secp256k1 + verifyIx 1](https://explorer.solana.com/tx/5SwHnzJZpmGMzTwsdMMK1xm3f3FzBgfDfsYhCbN1sb5NTqZchGsFCT9eYGD9ajPQQutH4qTo7H3YvytxkhoAJ4cv)
        1. txn fee(SOL) - 0.000045
        2. rent(SOL) - 0.00130152
    2. [secp256k1 + verifyIx 2](https://explorer.solana.com/tx/2KWCRfGuHVkr27yePvWEugwV2n8dcwTjNqgiTPMRNExwPd1QLpuFWLzL4Yhiv23F74DUEqsnusgfVJbgPUaCpj8c)
        1. txn fee (SOL) - 0.00004
    3. [postVAA](https://explorer.solana.com/tx/2oifDnA5oFG4CPg8tqqjivJ4CVrEpcx4aMWSK4fxh5fG8DLE2o79xwDTUc8GS9GtVwwjD3C5fA8WZocj9LDXYMrn)
        1. txn fee (SOL) - 0.000005
        2. rent (SOL) - 0.00247776
    4. [completeTransfer]
        1. txn fee (SOL) - 0.000005
        2. rent (SOL) - 0.00089784

## Solana Complete Flow

1. secp + verify (1-3 txns)
2. postVAA 1 txn
3. Complete
    1. PropEnabled
    2. !PropEnabled
4. ProcessPayload
    1. PropEnabled
        1. GasKickstart:
            1. !GasKickstart
               1.tsfer propeller.processPayloadFees(swimUSD) to payer
            2. GasKickstart
                1. convert gasKickstart -> USD [oracle]
                2. convert swimUSD -> marginal price token [marginal price pool + marginal price pool accounts]
                3. tsfer(propeller.processPayloadFees + gasKickstartInSwimUSD) to payer fee account
                4. tsfer gasKickstart from payer to swimPayload.logicalOwner
    2. output_token_index
        1. == 0 (swimUSD)
            1. transfer X swimUSD from redeemerEscrow to swimPayload.owner.getAssociatedTokenAccount(swimUSD)
        2. != 0
            1. removeExactBurn [flagshipPool]
            2. swapExactInput [metapool]
    3. need to handle creating the token account(s) for owner and account for the fees.
        1. Do we assume that if gas kickstart, then none of the accounts exist?
5.

## Dev

1. switch to using `#[access_control(...)]` for validation instead?
    1. leave seeds & bump in `#[account]` for IDL generation
    2. leave field accessor checks (e.g. `token::authority = payer`).
    3. these accessors are optmized to save compute and account validation assumed to be done outside of those methods.
    4. is this actually optimal? if the `Account<'info, T>` is specified, then it's going to be
       deserialized into that type anyways so would there be any significant difference?
    5. you would save compute budge if the accessor check failed but that's kind of useless anyways.
2. wormhole sender & redeemer are both "global" PDAs for the propeller programId
    1. could potentially have an exploit where someone else could initialize a different propeller state and then would have access to
       those same PDAs?
    2. if propeller state initialize() also initializes these PDAs then would this issue be avoided?
        1. creates issue that we would never be allowed to initialize another propeller state.
    3. remove the `token_bridge_mint` from the propeller
        1. if there's ever a reason to need to change the token_bridge_mint, would need to reinitialize the propeller account
            1. nvm - initailize a new propellerAccount.
3. handling fee reimbursment
    1. need to wrap wormhole secp256k1 ix + verify_signature + keep track of payer for each of these txns
    2. need to do the same for postVAA
    3. how to implement the "fallback" if slippage is exceeded on the final end for propellerEnabled payload
        1. not needed for v1 - all swaps will be market orders.
4. gas kickstart implementation
    1. current proposal - once bridged token has been redeemed on the receiving side, check how much of constituent token
       could be swapped for against "flagship pool". e.g. how much spl-usdc || spl-usdt could swimUSD be swapped for.
       then with check gas token <-> stablecoin exchange rate and see which will be most profitable then do swap. 1. issues: 1. for solana, would need to pass in all the necessary accounts to do the gas exchange 1. might need to force that it will only be based on whatever token is exchanged for at the end 2. actually think about this more from perspective of both the propeller vs user-handled. if user-handled then
       they have to have gas already. gas kickstart should inherently be a propeller-only txn. 2. using oracle examples: 1. pyth & anchor example - https://github.com/jet-lab/jet-v2/blob/master/programs/margin-pool/src/instructions/margin_refresh_position.rs 2. switchboard - https://github.com/switchboard-xyz/switchboard-v2-example
5. how should relayer determine if it should be the one to handle a vaa since fee is no longer in the payload.
    1. current spy-relayer checks:
        1. `payloadType === 1` -> `payloadType === 3`
        2. isApprovedToken() - loaded from config/env - just needs to be updated to swimUSD mint address.
        3. payload.fee && payload.fee > 0 12. this one may no longer be applicable or be able to be done in the same way.
    2. for non-relayer intended txns, do we still want to go through propeller contract?
        1. yes.
        2. make separate ixs? one for relayer, one for non-relayer
    3. checks if already queued in redis
        1. (not yet implemented) - checks if already redeemed.
    4. `if message.payload.from_address == propeller_contract && message.payload.swimpayload.relayerFee`
6. Nitpick - change `AccountInfo` types to `UncheckedAccount` to follow anchor doc recommendations

### Solana Redeem

1. CompleteWithPayload
    1. need to keep track of relayer fees and do transfers out of redeemer escrow account
        1. RelayerFee
        2. GasKickstart
    2. Oracle
        1. how to get price of swimUSD -> USDC
            1. oracle
            2. "get" function in pool
    3. "worst" case is Receive is meant for metapool

## Misc

1. [conventional-changelog/standard-version](https://github.com/conventional-changelog/standard-version)

# Resources

1. [setting up commitizen with yarn pnp](https://imch.dev/posts/commitizen-with-yarn-pnp/)

## Integration(EVM + Solana) Testing Notes:

1. attesting from solana only needs to be done once not once per source chain?
2. attest ix has no "destination chain" info
3. createWrapped needs to be done per recipient chain?
4. based off of wormhole integration.ts test example.

## Notes:

1.  number of accounts needed on solana side:
    1. 2-pool (+ 1 to all for pool program id account for CPI)
        1. 11 for add
        2. 10 for swap
        3. 11 for removeUniform
    2. WH (+ 1 to all for WH token bridge account)
    3. Transfer
        1. 17 for `TransferNative` (same for with payload)
        2. 17 for `TransferWrapped` (same for with payload).
           Probably don't need this since we should only be WH swimUSD from SOL
        3. `Complete`
        4. 14 for `CompleteNative` & `CompleteWrapped`
        5. 15 for `CompleteNativeWithPayload` & `CompleteWrappedWithPayload`
2.  shared_accounts
3.  payer of txn
4.  token_account for swimUSD?
5.  spl_token_program
6.  assumptions
7.  same address for all evm contracts
8.  (eventually) - pool auth will be merged into the pool state
9.  Solana Receiving side steps (assuming evm token_bridge_transfer message is already posted & vaa is signed):
10. postVAA()
    1.verify_signatures_ix (secp256k1 + verify_signatures)

    ```rust
       // bridge/program/wasm.rs
       #[wasm_bindgen]
        pub fn verify_signatures_ix(
        program_id: String,
        payer: String,
        guardian_set_index: u32,
        guardian_set: JsValue,
        signature_set: String,
        vaa_data: Vec<u8>,
        ) -> JsValue {
        let program_id = Pubkey::from_str(program_id.as_str()).unwrap();
        let payer = Pubkey::from_str(payer.as_str()).unwrap();
        let signature_set = Pubkey::from_str(signature_set.as_str()).unwrap();

        let guardian_set: GuardianSetData = guardian_set.into_serde().unwrap();
        let vaa = VAA::deserialize(vaa_data.as_slice()).unwrap();

        // Map signatures to guardian set
        let mut signature_items: Vec<SignatureItem> = Vec::new();
        for s in vaa.signatures.iter() {
            let mut item = SignatureItem {
                signature: s.signature.clone(),
                key: [0; 20],
                index: s.guardian_index as u8,
            };
            item.key = guardian_set.keys[s.guardian_index as usize];

            signature_items.push(item);
        }

        let vaa_body = &vaa_data[VAA::HEADER_LEN + VAA::SIGNATURE_LEN * vaa.signatures.len()..];
        let body_hash: [u8; 32] = {
            let mut h = sha3::Keccak256::default();
            h.write(vaa_body).unwrap();
            h.finalize().into()
        };

        let mut verify_txs: Vec<Vec<Instruction>> = Vec::new();
        for (_tx_index, chunk) in signature_items.chunks(7).enumerate() {
            let mut secp_payload = Vec::new();
            let mut signature_status = [-1i8; 19];

            let data_offset = 1 + chunk.len() * 11;
            let message_offset = data_offset + chunk.len() * 85;

            // 1 number of signatures
            secp_payload.write_u8(chunk.len() as u8).unwrap();

            // Secp signature info description (11 bytes * n)
            for (i, s) in chunk.iter().enumerate() {
                secp_payload
                    .write_u16::<LittleEndian>((data_offset + 85 * i) as u16)
                    .unwrap();
                secp_payload.write_u8(0).unwrap();
                secp_payload
                    .write_u16::<LittleEndian>((data_offset + 85 * i + 65) as u16)
                    .unwrap();
                secp_payload.write_u8(0).unwrap();
                secp_payload
                    .write_u16::<LittleEndian>(message_offset as u16)
                    .unwrap();
                secp_payload
                    .write_u16::<LittleEndian>(body_hash.len() as u16)
                    .unwrap();
                secp_payload.write_u8(0).unwrap();
                signature_status[s.index as usize] = i as i8;
            }

            // Write signatures and addresses
            for s in chunk.iter() {
                secp_payload.write(&s.signature).unwrap();
                secp_payload.write(&s.key).unwrap();
            }

            // Write body
            secp_payload.write(&body_hash).unwrap();

            let secp_ix = Instruction {
                program_id: solana_program::secp256k1_program::id(),
                data: secp_payload,
                accounts: vec![],
            };

            let payload = VerifySignaturesData {
                signers: signature_status,
            };

            let verify_ix = match verify_signatures(
                program_id,
                payer,
                guardian_set_index,
                signature_set,
                payload,
            ) {
                Ok(v) => v,
                Err(e) => panic!("{:?}", e),
            };

            verify_txs.push(vec![secp_ix, verify_ix])
        }

        JsValue::from_serde(&verify_txs).unwrap()
    }
    ```

          2. postVAA
          3. complete_transfer_with_payload()

11.
