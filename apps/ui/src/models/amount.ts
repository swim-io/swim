import type { u64 } from "@solana/spl-token";
import BN from "bn.js";
import Decimal from "decimal.js";

import { u64ToDecimal } from "../amounts";
import type { EcosystemId, TokenDetails, TokenSpec } from "../config";

export class Amount {
  public readonly tokenSpec: TokenSpec;
  public readonly value: Decimal;

  private constructor(tokenSpec: TokenSpec, value: Decimal) {
    this.tokenSpec = tokenSpec;
    this.value = value;
  }

  get tokenId(): string {
    return this.tokenSpec.id;
  }

  static zero(tokenSpec: TokenSpec): Amount {
    return new Amount(tokenSpec, new Decimal(0));
  }

  static fromHuman(tokenSpec: TokenSpec, value: Decimal): Amount {
    return new Amount(tokenSpec, value);
  }

  static fromU64(
    tokenSpec: TokenSpec,
    value: u64,
    ecosystemId: EcosystemId,
  ): Amount {
    return this.fromAtomic(tokenSpec, u64ToDecimal(value), ecosystemId);
  }

  static fromAtomic(
    tokenSpec: TokenSpec,
    value: Decimal,
    ecosystemId: EcosystemId,
  ): Amount {
    const details = tokenSpec.detailsByEcosystem.get(ecosystemId);
    if (!details) {
      throw new Error("No token details for ecosystem");
    }
    const convertedValue = value.div(10 ** details.decimals);
    return new Amount(tokenSpec, convertedValue);
  }

  static fromAtomicBn(
    tokenSpec: TokenSpec,
    value: BN,
    ecosystemId: EcosystemId,
  ): Amount {
    return Amount.fromAtomic(
      tokenSpec,
      new Decimal(value.toString()),
      ecosystemId,
    );
  }

  static fromHumanString(tokenSpec: TokenSpec, value: string): Amount {
    const strippedValue = value.replace(/,/g, "");
    return Amount.fromHuman(tokenSpec, new Decimal(strippedValue));
  }

  static fromAtomicString(
    tokenSpec: TokenSpec,
    value: string,
    ecosystemId: EcosystemId,
  ): Amount {
    return Amount.fromAtomic(tokenSpec, new Decimal(value), ecosystemId);
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  isPositive(): boolean {
    return this.value.isPositive();
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  toAtomic(ecosystemId: EcosystemId): Decimal {
    const { decimals } = this.details(ecosystemId);
    return this.value.mul(10 ** decimals).floor();
  }

  toHuman(ecosystemId: EcosystemId): Decimal {
    const { decimals } = this.details(ecosystemId);
    return this.toAtomic(ecosystemId).div(10 ** decimals);
  }

  toAtomicBn(ecosystemId: EcosystemId): BN {
    return new BN(this.toAtomic(ecosystemId).toFixed(0));
  }

  toAtomicString(ecosystemId: EcosystemId): string {
    const atomic = this.toAtomic(ecosystemId);
    return atomic.toFixed(0);
  }

  toHumanString(ecosystemId: EcosystemId): string {
    const human = this.toHuman(ecosystemId);
    return human.toFixed();
  }

  toFormattedHumanString(ecosystemId: EcosystemId): string {
    const humanString = this.toHuman(ecosystemId).toFixed(
      this.tokenSpec.project.isStablecoin ? 2 : undefined,
    );

    // NOTE: Safari doesn't support lookbehind :(
    const parts = humanString.split(".");
    const withThousandsSeparators = parts[0].replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ",",
    );
    return parts.length > 1
      ? `${withThousandsSeparators}.${parts[1]}`
      : withThousandsSeparators;
  }

  toJSON(): string {
    return this.toHumanString(this.tokenSpec.nativeEcosystem);
  }

  toPrimitive(): string {
    return this.toHumanString(this.tokenSpec.nativeEcosystem);
  }

  equals(amount: Amount): boolean {
    this.ensureSameToken(amount);
    return this.value.equals(amount.value);
  }

  gt(amount: Amount): boolean {
    this.ensureSameToken(amount);
    return this.value.gt(amount.value);
  }

  gte(amount: Amount): boolean {
    this.ensureSameToken(amount);
    return this.value.gte(amount.value);
  }

  lt(amount: Amount): boolean {
    this.ensureSameToken(amount);
    return this.value.lt(amount.value);
  }

  lte(amount: Amount): boolean {
    this.ensureSameToken(amount);
    return this.value.lte(amount.value);
  }

  add(amount: Amount): Amount {
    this.ensureSameToken(amount);
    const result = this.value.plus(amount.value);
    return new Amount(this.tokenSpec, result);
  }

  sub(amount: Amount): Amount {
    this.ensureSameToken(amount);
    const result = this.value.sub(amount.value);
    return new Amount(this.tokenSpec, result);
  }

  mul(scalar: Decimal | number): Amount {
    const result = this.value.mul(scalar);
    return new Amount(this.tokenSpec, result);
  }

  div(scalar: Decimal | number): Amount {
    const result = this.value.div(scalar);
    return new Amount(this.tokenSpec, result);
  }

  details(ecosystemId: EcosystemId): TokenDetails {
    const details = this.tokenSpec.detailsByEcosystem.get(ecosystemId);
    if (!details) {
      throw new Error("No token details for ecosystem");
    }
    return details;
  }

  private ensureSameToken(amount: Amount): void {
    if (amount.tokenId !== this.tokenId) {
      throw new Error("Amounts are for different tokens");
    }
  }
}
