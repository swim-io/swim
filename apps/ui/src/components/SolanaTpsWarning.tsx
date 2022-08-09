import { EuiCallOut, EuiSpacer, EuiText } from "@elastic/eui";
import { Env } from "@swim-io/core";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

import { useEnvironment } from "../core/store";
import { useSolanaConnection } from "../hooks/solana";

const INTERVAL_FREQUENCY_MS = 60000; // 1 minute.
const SAMPLES_LIMIT = 5;

export const SolanaTpsWarning = (): ReactElement => {
  // Assume Solana TPS healthy.
  const [tps, setTps] = useState<number>(2000);
  const { env } = useEnvironment();
  const connection = useSolanaConnection();
  const checkSolanaTps = useCallback(async () => {
    try {
      const samples =
        await connection.rawConnection.getRecentPerformanceSamples(
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
  }, [connection]);

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
      <EuiCallOut title="Solana Network Down" color="danger">
        <EuiText>
          <p>
            {"We've detected downtime on the "}
            <a href="https://status.solana.com/">Solana Network </a>
            {" and thus advise against swapping at this time."}
          </p>
        </EuiText>
      </EuiCallOut>
      <EuiSpacer />
    </>
  ) : (
    <>
      <EuiCallOut title="Solana Network Congested" color="warning">
        <EuiText>
          <p>
            {`Solana’s Transactions Per Second is low (${tps.toLocaleString(
              undefined,
              { maximumFractionDigits: 2 },
            )} TPS), causing network congestion. Please proceed with caution as transactions may take a long time to confirm.`}
          </p>
        </EuiText>
      </EuiCallOut>
      <EuiSpacer />
    </>
  );
};
