import type { ReadonlyRecord } from "@swim-io/utils";

export enum Language {
  En = "en",
  Ja = "ja",
  Ru = "ru",
  ZhCn = "zh-CN",
}

export const languageDisplayOrder: readonly Language[] = [
  Language.En,
  Language.ZhCn,
  Language.Ru,
  Language.Ja,
];

export const languageNameMapping: ReadonlyRecord<Language, string> = {
  [Language.En]: "English",
  [Language.Ja]: "日本語",
  [Language.Ru]: "Русский язык",
  [Language.ZhCn]: "简体中文",
};
