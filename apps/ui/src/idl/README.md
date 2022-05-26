# IDL

This directory contains Anchor IDLs (interactive data language) for Solana smart contracts.

### Generating

Specifications for generating an IDLs can be read (here)[https://project-serum.github.io/anchor/cli/commands.html#cluster-list].

### Usage

Below is an example of creating a client from an IDL.

```
import { Program } from "@project-serum/anchor";
const anchorProvider = useAnchorProvider();
const program = new Program(
  redeemerIdl as Idl,
  redeemer.programAddress,
  anchorProvider,
);
```
