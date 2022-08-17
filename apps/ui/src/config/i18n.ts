import type { ReadonlyRecord } from "@swim-io/utils";

export enum Language {
  En = "en",
}

export const languageNameMapping: ReadonlyRecord<Language, string> = {
  [Language.En]: "English",
};
