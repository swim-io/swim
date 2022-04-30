export enum Env {
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Localnet = "Localnet",
  CustomLocalnet = "CustomLocalnet",
}

export const DEFAULT_ENV = Env.Mainnet;

export const isValidEnv = (envValue: string): envValue is Env =>
  (Object.values(Env) as readonly string[]).includes(envValue);
