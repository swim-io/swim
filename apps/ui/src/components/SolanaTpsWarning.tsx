import { EuiCallOut, EuiSpacer, EuiText } from "@elastic/eui";
import { Env } from "@swim-io/core";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useEnvironment } from "../core/store";
import { useIntlNumberFormatter, useSolanaClient } from "../hooks";

const INTERVAL_FREQUENCY_MS = 60000; // 1 minute.
const SAMPLES_LIMIT = 5;

export const SolanaTpsWarning = (): ReactElement => {
  const { t } = useTranslation();
  const numberFormatter = useIntlNumberFormatter({
    maximumFractionDigits: 2,
  });
  // Assume Solana TPS healthy.
  const [tps, setTps] = useState<number>(2000);
  const { env } = useEnvironment();
  const client = useSolanaClient();
  const checkSolanaTps = useCallback(async () => {
    try {
      const samples = await client.connection.getRecentPerformanceSamples(
        SAMPLES_LIMIT,
      );
      if (samples.length >= 1) {
        const stats = samples.reduce(
          ({ numTps, numSeconds }, sample) => ({
            numTps: numTps + sample.numTransactions,
            numSeconds: numSeconds + sample.samplePeriodSecs,
          }),
          { numTps: 0, numSeconds: 0 },
        );
        const avgTps = stats.numTps / stats.numSeconds;
        setTps(avgTps);
      }
    } catch (e) {
      // Do nothing with sampling or math errors.
      console.warn(e);
    }
  }, [client]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkSolanaTps().catch(console.error);
    }, INTERVAL_FREQUENCY_MS);

    return () => {
      clearInterval(interval);
    };
  }, [checkSolanaTps]);

  // Don't show for non-mainnet environments.
  if (env !== Env.Mainnet || tps >= 1500) {
    return <></>;
  }
  return tps === 0 ? (
    <>
      <EuiCallOut
        title={t("solana_tps_warning.network_down_title")}
        color="danger"
      >
        <EuiText>
          <p>
            <Trans
              i18nKey="solana_tps_warning.network_down_description"
              components={{
                // eslint-disable-next-line jsx-a11y/anchor-has-content
                a: <a href="https://status.solana.com/" />,
              }}
            />
          </p>
        </EuiText>
      </EuiCallOut>
      <EuiSpacer />
    </>
  ) : (
    <>
      <EuiCallOut
        title={t("solana_tps_warning.network_congested_title")}
        color="warning"
      >
        <EuiText>
          <p>
            {t("solana_tps_warning.network_congested_description", {
              tps: numberFormatter.format(tps),
            })}
          </p>
        </EuiText>
      </EuiCallOut>
      <EuiSpacer />
    </>
  );
};
