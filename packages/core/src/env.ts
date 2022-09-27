/** The various environments in which Swim might be used */
export enum Env {
  Mainnet = "Mainnet",
  Testnet = "Testnet",
  Local = "Local",
  Custom = "Custom",
}

export const isValidEnv = (env: string): env is Env =>
  (Object.values(Env) as readonly string[]).includes(env);
