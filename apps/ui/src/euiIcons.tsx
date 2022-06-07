/* eslint-disable import/extensions */

// @ts-expect-error no definitions
import { icon as EuiIconAlert } from "@elastic/eui/es/components/icon/assets/alert";
// @ts-expect-error no definitions
import { icon as EuiIconAppAdvancedSettings } from "@elastic/eui/es/components/icon/assets/app_advanced_settings";
// @ts-expect-error no definitions
import { icon as EuiIconAppIndexPattern } from "@elastic/eui/es/components/icon/assets/app_index_pattern";
// @ts-expect-error no definitions
import { icon as EuiIconAppSecurity } from "@elastic/eui/es/components/icon/assets/app_security";
// @ts-expect-error no definitions
import { icon as EuiIconApps } from "@elastic/eui/es/components/icon/assets/apps";
// @ts-expect-error no definitions
import { icon as EuiIconArrowDown } from "@elastic/eui/es/components/icon/assets/arrow_down";
// @ts-expect-error no definitions
import { icon as EuiIconArrowRight } from "@elastic/eui/es/components/icon/assets/arrow_right";
// @ts-expect-error no definitions
import { icon as EuiIconBug } from "@elastic/eui/es/components/icon/assets/bug";
// @ts-expect-error no definitions
import { icon as EuiIconCheck } from "@elastic/eui/es/components/icon/assets/check";
// @ts-expect-error no definitions
import { icon as EuiIconClock } from "@elastic/eui/es/components/icon/assets/clock";
// @ts-expect-error no definitions
import { icon as EuiIconCross } from "@elastic/eui/es/components/icon/assets/cross";
// @ts-expect-error no definitions
import { icon as EuiIconCrossInACircleFilled } from "@elastic/eui/es/components/icon/assets/crossInACircleFilled";
// @ts-expect-error no definitions
import { icon as EuiIconDocumentEdit } from "@elastic/eui/es/components/icon/assets/documentEdit";
// @ts-expect-error no definitions
import { icon as EuiIconGear } from "@elastic/eui/es/components/icon/assets/gear";
// @ts-expect-error no definitions
import { icon as EuiIconHome } from "@elastic/eui/es/components/icon/assets/home";
// @ts-expect-error no definitions
import { icon as EuiIconLayers } from "@elastic/eui/es/components/icon/assets/layers";
// @ts-expect-error no definitions
import { icon as EuiIconMerge } from "@elastic/eui/es/components/icon/assets/merge";
// @ts-expect-error no definitions
import { icon as EuiIconMobile } from "@elastic/eui/es/components/icon/assets/mobile";
// @ts-expect-error no definitions
import { icon as EuiIconOffline } from "@elastic/eui/es/components/icon/assets/offline";
// @ts-expect-error no definitions
import { icon as EuiIconPopout } from "@elastic/eui/es/components/icon/assets/popout";
// @ts-expect-error no definitions
import { icon as EuiIconQuestionInCircle } from "@elastic/eui/es/components/icon/assets/question_in_circle";
// @ts-expect-error no definitions
import { icon as EuiIconRefresh } from "@elastic/eui/es/components/icon/assets/refresh";
// @ts-expect-error no definitions
import { icon as EuiIconReturnKey } from "@elastic/eui/es/components/icon/assets/return_key";
// @ts-expect-error no definitions
import { icon as EuiIconVector } from "@elastic/eui/es/components/icon/assets/vector";
// @ts-expect-error no definitions
import { icon as EuiIconVisGauge } from "@elastic/eui/es/components/icon/assets/vis_gauge";
// @ts-expect-error no definitions
import { appendIconComponentCache } from "@elastic/eui/es/components/icon/icon";

// Preload specific icons to stop LoadChunkError("Cant find icon")
// Context: https://github.com/elastic/eui/blob/main/wiki/consuming.md#failing-icon-imports
export const _ = appendIconComponentCache({
  advancedSettingsApp: EuiIconAppAdvancedSettings,
  alert: EuiIconAlert,
  appSecurity: EuiIconAppSecurity,
  apps: EuiIconApps,
  arrowDown: EuiIconArrowDown,
  arrowRight: EuiIconArrowRight,
  bug: EuiIconBug,
  check: EuiIconCheck,
  clock: EuiIconClock,
  cross: EuiIconCross,
  crossInACircleFilled: EuiIconCrossInACircleFilled,
  documentEdit: EuiIconDocumentEdit,
  gear: EuiIconGear,
  home: EuiIconHome,
  indexPatternApp: EuiIconAppIndexPattern,
  layers: EuiIconLayers,
  mobile: EuiIconMobile,
  merge: EuiIconMerge,
  offline: EuiIconOffline,
  popout: EuiIconPopout,
  questionInCircle: EuiIconQuestionInCircle,
  refresh: EuiIconRefresh,
  returnKey: EuiIconReturnKey,
  vector: EuiIconVector,
  visGauge: EuiIconVisGauge,
});
