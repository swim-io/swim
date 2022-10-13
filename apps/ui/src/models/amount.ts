import type { TokenDetails } from "@swim-io/core";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import BN from "bn.js";
import Decimal from "decimal.js";

import type { EcosystemId, TokenConfig } from "../config";
import { getTokenDetailsForEcosystem } from "../config";
import { fallbackLanguageIfNotSupported, i18next } from "../i18n";

export class Amount {
  public readonly tokenConfig: TokenConfig;
  private readonly value: Decimal;

  private constructor(tokenConfig: TokenConfig, value: Decimal) {
    this.tokenConfig = tokenConfig;
    this.value = value;
  }

  public get tokenId(): string {
    return this.tokenConfig.id;
  }

  public static zero(tokenConfig: TokenConfig): Amount {
    return new Amount(tokenConfig, new Decimal(0));
  }

  public static fromHuman(tokenConfig: TokenConfig, value: Decimal): Amount {
    return new Amount(tokenConfig, value);
  }

  public static fromAtomic(
    tokenConfig: TokenConfig,
    value: Decimal,
    ecosystemId: EcosystemId,
  ): Amount {
    const details = getTokenDetailsForEcosystem(tokenConfig, ecosystemId);
    if (!details) {
      throw new Error(
        `No token details for ecosystem ${ecosystemId} and token '${tokenConfig.id}'`,
      );
    }
    const convertedValue = value.div(10 ** details.decimals);
    return new Amount(tokenConfig, convertedValue);
  }

  public static fromAtomicBn(
    tokenConfig: TokenConfig,
    value: BN | bigint,
    ecosystemId: EcosystemId,
  ): Amount {
    return Amount.fromAtomic(
      tokenConfig,
      new Decimal(value.toString()),
      ecosystemId,
    );
  }

  /** Always parse from standard number which uses `,` as group separators and `.` as decimal separators */
  public static fromHumanString(
    tokenConfig: TokenConfig,
    value: string,
  ): Amount {
    const strippedValue = value.replace(/,/g, "");
    return Amount.fromHuman(tokenConfig, new Decimal(strippedValue));
  }

  public static fromAtomicString(
    tokenConfig: TokenConfig,
    value: string,
    ecosystemId: EcosystemId,
  ): Amount {
    return Amount.fromAtomic(tokenConfig, new Decimal(value), ecosystemId);
  }

  public isNegative(): boolean {
    return this.value.isNegative();
  }

  public isPositive(): boolean {
    return this.value.isPositive();
  }

  public isZero(): boolean {
    return this.value.isZero();
  }

  public toAtomic(ecosystemId: EcosystemId): Decimal {
    const { decimals } = this.details(ecosystemId);
    return this.value.mul(10 ** decimals).floor();
  }

  public toHuman(ecosystemId: EcosystemId): Decimal {
    const { decimals } = this.details(ecosystemId);
    return this.toAtomic(ecosystemId).div(10 ** decimals);
  }

  public toAtomicBn(ecosystemId: EcosystemId): BN {
    return new BN(this.toAtomic(ecosystemId).toFixed(0));
  }

  public toAtomicString(ecosystemId: EcosystemId): string {
    const atomic = this.toAtomic(ecosystemId);
    return atomic.toFixed(0);
  }

  public toHumanString(ecosystemId: EcosystemId): string {
    const human = this.toHuman(ecosystemId);
    return human.toFixed();
  }

  public toFormattedHumanString(ecosystemId: EcosystemId): string {
    const language = fallbackLanguageIfNotSupported(
      Intl.NumberFormat,
      i18next.resolvedLanguage,
    );
    const numberFormatter = new Intl.NumberFormat(language, {
      ...(TOKEN_PROJECTS_BY_ID[this.tokenConfig.projectId].isStablecoin ||
      TOKEN_PROJECTS_BY_ID[this.tokenConfig.projectId].isSwimUsd
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

  public toJSON(): string {
    return this.toHumanString(this.tokenConfig.nativeEcosystemId);
  }

  public toPrimitive(): string {
    return this.toHumanString(this.tokenConfig.nativeEcosystemId);
  }

  public equals(amount: Amount): boolean {
    this.ensureSameToken(amount);
    return this.value.equals(amount.value);
  }

  public gt(amount: Amount): boolean {
    this.ensureSameToken(amount);
    return this.value.gt(amount.value);
  }

  public gte(amount: Amount): boolean {
    this.ensureSameToken(amount);
    return this.value.gte(amount.value);
  }

  public lt(amount: Amount): boolean {
    this.ensureSameToken(amount);
    return this.value.lt(amount.value);
  }

  public lte(amount: Amount): boolean {
    this.ensureSameToken(amount);
    return this.value.lte(amount.value);
  }

  public add(amount: Amount): Amount {
    this.ensureSameToken(amount);
    const result = this.value.plus(amount.value);
    return new Amount(this.tokenConfig, result);
  }

  public sub(amount: Amount): Amount {
    this.ensureSameToken(amount);
    const result = this.value.sub(amount.value);
    return new Amount(this.tokenConfig, result);
  }

  public mul(scalar: Decimal | number): Amount {
    const result = this.value.mul(scalar);
    return new Amount(this.tokenConfig, result);
  }

  public div(scalar: Decimal | number): Amount {
    const result = this.value.div(scalar);
    return new Amount(this.tokenConfig, result);
  }

  public requiresRounding(ecosystemId: EcosystemId): boolean {
    return this.value.decimalPlaces() > this.details(ecosystemId).decimals;
  }

  private details(ecosystemId: EcosystemId): TokenDetails {
    const details = getTokenDetailsForEcosystem(this.tokenConfig, ecosystemId);
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
