/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TokenSpec } from "./config";
import { Env, tokens } from "./config";

export const mockOf = <T>(v: (...any: any) => T): jest.Mock<Partial<T>> =>
  v as unknown as jest.Mock<Partial<T>>;

export const findLocalnetTokenById = (tokenId: string): TokenSpec =>
  tokens[Env.Localnet].find(({ id }) => id === tokenId)!;
