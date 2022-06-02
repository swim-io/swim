import { EuiCallOut, EuiSpacer, EuiText } from "@elastic/eui";
import { Connection } from "@solana/web3.js";
import type react from "react";
import { useEffect, useState } from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";

const INTERVAL_FREQUENCY_MS = 5000; // 5 seconds.
const SAMPLES_LIMIT = 5;

export const SolanaTpsWarning = (): react.ReactElement | null => {
  const [tps, setTps] = useState<number | null>(null);
  const { chains } = useEnvironment(selectConfig, shallow);
  const [chain] = chains[Protocol.Solana];
  const { endpoint } = chain;
  const connection = new Connection(endpoint); // We can create Connection here and just call it in interval

  const checkSolanaTps = async () => {
    try {
      // TODO: There is a bug with getRecentPerformanceSamples in which a new connection needs to be made.
      // Should be fixed in subsequent Solana versions.
      // https://github.com/solana-labs/solana/issues/19419
      const samples = await connection.getRecentPerformanceSamples(
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
        if (tps && avgTps >= 1500) {
          setTps(null);
        } else if (!tps && avgTps > 0) {
          setTps(avgTps);
        }
      }
    } catch (e) {
      // Do nothing with sampling error.
      console.warn(e);
    }
  };

  useEffect(() => {
    const interval = setInterval(
      async () => await checkSolanaTps(),
      INTERVAL_FREQUENCY_MS,
    );

    checkSolanaTps().catch((err) => console.warn(err));

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (tps && tps > 0) {
    return (
      <>
        <EuiCallOut title="Slow TPS" color="warning">
          <EuiText>
            <p>
              {
                "Solana Transactions Per Second (TPS) is low and thus advise agaisnt swapping at this time. "
              }
              <b>
                {`Current TPS: ${tps.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`}
              </b>
            </p>
          </EuiText>
        </EuiCallOut>
        <EuiSpacer />
      </>
    );
  }
  return (
    <>
      <EuiCallOut title="Solana Network Down" color="danger">
        <EuiText>
          <p>
            {"We've detected downtime on the"}
            <a href="https://status.solana.com/">Solana Network </a>
            {" and thus advise agaisnt swapping at this time."}
          </p>
        </EuiText>
      </EuiCallOut>
      <EuiSpacer />
    </>
  );
};

