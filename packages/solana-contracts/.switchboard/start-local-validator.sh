#!/bin/bash

mkdir -p .anchor/test-ledger

solana-test-validator -r --ledger .anchor/test-ledger --mint GPy3FiGpEyMFCTsYgcw9i6rSWsvJpgzA39QDXv8zquW --bind-address 0.0.0.0 --url https://api.devnet.solana.com --rpc-port 8899  --clone 2TfB33aLaneQb5TNVwyDz3jSZXS6jdW2ARw1Dgf84XCG `# programId` \
--clone J4CArpsbrZqu1axqQ4AnrqREs3jwoyA1M5LMiQQmAzB9 `# programDataAddress` \
--clone CKwZcshn4XDvhaWVH9EXnk3iu19t6t5xP2Sy2pD6TRDp `# idlAddress` \
--clone BYM81n8HvTJuqZU1PmTVcwZ9G8uoji7FKM6EaPkwphPt `# programState` \
--clone FVLfR6C2ckZhbSwBzZY4CX7YBcddUSge5BNeGQv5eKhy `# switchboardVault` \
--clone So11111111111111111111111111111111111111112 `# switchboardMint` \
--clone CB4VzLxTwECHuqs4eqXywLXGwpQw3mVqe3NhPMSerNMJ `# tokenWallet` \
--clone AcSXYonfyHTDJeAcWPNMyyZusKJCZXdGrMN33NBXoAaV `# queue` \
--clone GPy3FiGpEyMFCTsYgcw9i6rSWsvJpgzA39QDXv8zquW `# queueAuthority` \
--clone 4ptM4oxd9tE7ajPqKPZoJuqK7yhTSod5sZNptQBmP1Fh `# queueBuffer` \
--clone Bp2Z3RufYVxncybo4bBnrJgjT8nNtLQ4gCMmEPaQMt9e `# crank` \
--clone HNHxWYVF8Qg6pLX4rmi4GH2yJzo9s2jpAnMzAErUWKek `# crankBuffer` \
--clone 7pqX6qEABdf9rUeLW7YXZn3hqBMqAxZMgTKY8xaXrkaF `# oracle` \
--clone GPy3FiGpEyMFCTsYgcw9i6rSWsvJpgzA39QDXv8zquW `# oracleAuthority` \
--clone J4ujfcYoiLsNRGbjAJPzD9mwGYS1ZPFyBmDRRWzLsB52 `# oracleEscrow` \
--clone 39hSPM6mK7DCDwWdkTs2gmGLBsRYmNpLfLD89aPQfB56 `# oraclePermissions` \
--clone 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU `# additionalClonedAccounts`