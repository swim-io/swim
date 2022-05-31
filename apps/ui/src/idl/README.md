# IDL

This directory contains Anchor IDLs (interactive data language) for Solana smart contracts. With an IDL specification, the data types and interfaces of a smart contract are defined, making it easy to generate a FE client.

### Generating

Specifications for generating an IDL from a rust file can be read (here)[https://project-serum.github.io/anchor/cli/commands.html#cluster-list].

### Usage

Below is an example of creating a client from an IDL.

```
import { Program } from "@project-serum/anchor";
import redeemerIdl from "src/idl/redeem.json";
const anchorProvider = useAnchorProvider();
const program = new Program(
  redeemerIdl as Idl,
  redeemer.programAddress,  // Address of your smart contract (PublicKey)
  anchorProvider,
);

program.methods.doMethod().accounts({
  // Input accounts
});

```
