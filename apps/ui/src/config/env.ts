import { getRecordValues } from "../utils";

export enum Env {
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Localnet = "Localnet",
  CustomLocalnet = "CustomLocalnet",
}

export const DEFAULT_ENV = Env.Mainnet;

export const isValidEnv = (envValue: string): envValue is Env =>
  getRecordValues(Env).includes(envValue as Env);
