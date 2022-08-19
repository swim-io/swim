import type { Account as TokenAccount } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";

export const MOCK_TOKEN_ACCOUNTS: readonly TokenAccount[] = [
  {
    mint: new PublicKey("9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("00", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("9xDYy7dmSEQePAurpoQTW43ubKuKh67PaUwmUwfkcNm"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
  {
    mint: new PublicKey("nftMANh29jbMboVnbYt1AUAWFP9N4Jnckr9Zeq85WUs"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("01", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("2fTUrYeKnJjxS6AbNJRJ6zS39rbLUqHJBEPX4ufsCAbF"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
  {
    mint: new PublicKey("USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("0383815bf00bf5", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("3f77zu2FHFXdXjYZ8E8LPQq4cU67yYkRw3xvDG6P27Jy"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
  {
    mint: new PublicKey("LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("1772aa70e3c579", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("6vQZbArmuXmapqpVSpcB3EBpyTcrvw7yGJ6kJRmweX6x"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
  {
    mint: new PublicKey("4X3Fu7ZcRSf7dvKEwwQ8b5xb2jQg2NPNkWs1gDGf1WMg"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("00", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("8asHr5Bf6hWBU6Pg7Hi9PKeo9mFj6iYGALySJRKq6FRE"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
  {
    mint: new PublicKey("9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("05f55913", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
  {
    mint: new PublicKey("USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("038373ef883a7d", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("BBtg88Fo2JPs9DE2PxSieezKsvzoNWwCu6eWU3tBzLm1"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
  {
    mint: new PublicKey("Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("00", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
  {
    mint: new PublicKey("2WDq7wSs9zYrpx2kbHDA4RUTRch2CCTP6ZWaH4GNfnQQ"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("8ac7230489e80000", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("BhxSeLbNAKoToEyEf8rPHEv4vSgFTPpXdEJdZT6BBZn1"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
  {
    mint: new PublicKey("BVxyYhm498L79r4HMQ9sxZ5bi41DmJmeWZ7SCS7Cyvna"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("01", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("C4e3n4TdpP3nGj7NPDdUpSWSHHRecUXbvyJnWjUS4F5w"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
  {
    mint: new PublicKey("SWMPqjB9AAtpCbatAEEGK67wNBCN1HDW6VypX7E5r9g"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("038d7ea4c68000", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("ENADJnkeiAVqPZ2FVCYzCccNvhCFoNa9Fz9o68nJfp68"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
  {
    mint: new PublicKey("81CsrPD2M6m1nHEWTuHFaRMSEBcFViwv8LJNqaEZpUHp"),
    owner: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
    amount: new BN("00", "hex"),
    delegate: null,
    isNative: false,
    delegatedAmount: new BN("00", "hex"),
    closeAuthority: null,
    address: new PublicKey("FJtYEZUToEw9YBzLeLUXnoLcEybBz2PDK3iLTTvhmg8G"),
    isInitialized: true,
    isFrozen: false,
    rentExemptReserve: null,
  },
];
