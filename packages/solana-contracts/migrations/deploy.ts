// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires,import/unambiguous,import/no-commonjs
const anchor = require("@project-serum/anchor");

// eslint-disable-next-line @typescript-eslint/require-await,functional/immutable-data,import/no-commonjs
module.exports = async function (provider) {
  // Configure client to use the provider.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  anchor.setProvider(provider);

  // Add your deploy script here.
};
