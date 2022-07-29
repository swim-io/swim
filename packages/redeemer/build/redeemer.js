"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemerConfigs = void 0;
var core_1 = require("@swim-io/core");
var devnet = {
    programAddress: "7frYsb48TdaenQpmVxRHgMnNL861aK1aeq6aTkVrUkDt",
    programPda: "2znJvHcqpqVuP6aX6at386Z3dhtgBbjL1ix5oDpZzNfi",
    nftCollection: "6rVZuenNaw3uECQjMjTLcfrXYKszpESEGi9HZnffJstn",
    vaultMint: "A8UVBwvj1XcdP5okoMqkjhCQGLaqQ8iJDYnNxAMbsNNF",
    vaultTokenAccount: "tJQbYYmxKqzqaswHrq8Mg7ZqmB9DNhs35SKdsEKABo9",
};
exports.redeemerConfigs = new Map([
    [core_1.Env.Devnet, devnet],
]);
//# sourceMappingURL=redeemer.js.map