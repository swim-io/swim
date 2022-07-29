/** The various environments in which Swim might be used */
export enum Env {
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Local = "Local",
  Custom = "Custom",
}

export const isValidEnv = (env: string): env is Env =>
  (Object.values(Env) as readonly string[]).includes(env);
