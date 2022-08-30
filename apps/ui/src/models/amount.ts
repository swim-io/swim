import type { TokenDetails } from "@swim-io/core";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import BN from "bn.js";
import Decimal from "decimal.js";

import type { EcosystemId, TokenSpec } from "../config";
import { getTokenDetailsForEcosystem } from "../config";
import { fallbackLanguageIfNotSupported, i18next } from "../i18n";

export class Amount {
  public readonly tokenSpec: TokenSpec;
  private readonly value: Decimal;

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

  static fromAtomic(
    tokenSpec: TokenSpec,
    value: Decimal,
    ecosystemId: EcosystemId,
  ): Amount {
    const details = getTokenDetailsForEcosystem(tokenSpec, ecosystemId);
    if (!details) {
      throw new Error(
        `No token details for ecosystem ${ecosystemId} and token '${tokenSpec.id}'`,
      );
    }
    const convertedValue = value.div(10 ** details.decimals);
    return new Amount(tokenSpec, convertedValue);
  }

  static fromAtomicBn(
    tokenSpec: TokenSpec,
    value: BN | bigint,
    ecosystemId: EcosystemId,
  ): Amount {
    return Amount.fromAtomic(
      tokenSpec,
      new Decimal(value.toString()),
      ecosystemId,
    );
  }

  /** Always parse from standard number which uses `,` as group separators and `.` as decimal separators */
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
    const language = fallbackLanguageIfNotSupported(
      Intl.NumberFormat,
      i18next.resolvedLanguage,
    );
    const numberFormatter = new Intl.NumberFormat(language, {
      ...(TOKEN_PROJECTS_BY_ID[this.tokenSpec.projectId].isStablecoin
        ? {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        : {
            maximumFractionDigits: 20, // max value allowed
          }),
    });

    return numberFormatter.format(this.toHuman(ecosystemId).toNumber());
  }

  toJSON(): string {
    return this.toHumanString(this.tokenSpec.nativeEcosystemId);
  }

  toPrimitive(): string {
    return this.toHumanString(this.tokenSpec.nativeEcosystemId);
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

  requiresRounding(ecosystemId: EcosystemId): boolean {
    return this.value.decimalPlaces() > this.details(ecosystemId).decimals;
  }

  private details(ecosystemId: EcosystemId): TokenDetails {
    const details = getTokenDetailsForEcosystem(this.tokenSpec, ecosystemId);
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
