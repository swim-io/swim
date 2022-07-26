import { getRecordValues } from "@swim-io/utils";

export enum Env {
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Localnet = "Localnet",
  CustomLocalnet = "CustomLocalnet",
}

export const DEFAULT_ENV = Env.Mainnet;

export const isValidEnv = (envValue: string): envValue is Env =>
  getRecordValues(Env).some((env) => env === envValue);
