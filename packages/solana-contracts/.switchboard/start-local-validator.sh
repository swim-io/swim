#!/bin/bash

mkdir -p .anchor/test-ledger

solana-test-validator -r --ledger .anchor/test-ledger --mint GPy3FiGpEyMFCTsYgcw9i6rSWsvJpgzA39QDXv8zquW --bind-address 0.0.0.0 --url https://api.devnet.solana.com --rpc-port 8899  --clone 2TfB33aLaneQb5TNVwyDz3jSZXS6jdW2ARw1Dgf84XCG `# programId` \
--clone J4CArpsbrZqu1axqQ4AnrqREs3jwoyA1M5LMiQQmAzB9 `# programDataAddress` \
--clone CKwZcshn4XDvhaWVH9EXnk3iu19t6t5xP2Sy2pD6TRDp `# idlAddress` \
--clone BYM81n8HvTJuqZU1PmTVcwZ9G8uoji7FKM6EaPkwphPt `# programState` \
--clone FVLfR6C2ckZhbSwBzZY4CX7YBcddUSge5BNeGQv5eKhy `# switchboardVault` \
--clone So11111111111111111111111111111111111111112 `# switchboardMint` \
--clone CB4VzLxTwECHuqs4eqXywLXGwpQw3mVqe3NhPMSerNMJ `# tokenWallet` \
--clone EsMStifp1grA4Tuv9oqiHdTV33VvCBmbbkZVrSNBVfiG `# queue` \
--clone GPy3FiGpEyMFCTsYgcw9i6rSWsvJpgzA39QDXv8zquW `# queueAuthority` \
--clone 4cYYiWyfsrMsa1H6Ypq9LuMv9PTRd3YLFDxhyDJa4qG1 `# queueBuffer` \
--clone DtD8wtWMtGszGEUNxiRpxSUinBNvTwjbwp9RKsLDZpBc `# crank` \
--clone 4m8WiDn49Ygy3uK5nDKoJPaq8tNhtwgjddGJSvPhQwfg `# crankBuffer` \
--clone 5shyzhuvdw2SF2g4mGUKRaStvrXT5k6TK2v13FMGLrLa `# oracle` \
--clone GPy3FiGpEyMFCTsYgcw9i6rSWsvJpgzA39QDXv8zquW `# oracleAuthority` \
--clone 3xBf7QZ7tw8qNZ6k4az2dfUnREgmn2fMtRszDnS6yeVN `# oracleEscrow` \
--clone B764Cfh6qRHKRFM17Y1Y9jZWX2wzmZaEZAoDEQUsDgrx `# oraclePermissions` \
--clone 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU `# additionalClonedAccounts`