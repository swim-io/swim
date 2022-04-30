import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import type { ReactElement } from "react";

import { useTitle } from "../hooks";

const SecurityPage = (): ReactElement => {
  useTitle("Security Policy");
  return (
    <EuiPage className="securityPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiTitle>
              <h2>Security Policy</h2>
            </EuiTitle>
            <EuiSpacer />
            <EuiText>
              <p>
                We value the work done by security researchers. We are committed
                to working with this community to verify, reproduce, and respond
                to legitimate reported vulnerabilities. We encourage the
                community to participate in our responsible reporting process.
              </p>
              <p>
                If you are a security researcher and would like to report a
                security vulnerability, please send an email to: admin@swim.io.
                Please provide your name, contact information, and company name
                (if applicable) with each report.
              </p>

              <p>
                <a href="/pgp-key.txt">Download our PGP Key</a>
              </p>

              <p>
                <span>You may also report vulnerabilities through our</span>{" "}
                <a href="https://immunefi.com/bounty/swimprotocol/">
                  bug bounty program on Immunefi
                </a>
                <span>.</span>
              </p>

              <h3>Responsible Disclosure Guidelines</h3>
              <p>
                <span>
                  To encourage responsible reporting, we commit that we will not
                  take legal action against you or ask law enforcement to
                  investigate you if you comply with the following Responsible
                  Disclosure Guidelines:
                </span>
                <ul>
                  <li>
                    Provide details of the vulnerability, including information
                    needed to reproduce and validate the vulnerability and a
                    Proof of Concept (POC)
                  </li>
                  <li>
                    Make a good faith effort to avoid privacy violations,
                    destruction of data and interruption or degradation of our
                    services
                  </li>
                  <li>
                    Do not modify or access data that does not belong to you
                  </li>
                  <li>
                    Give us a reasonable time to correct the issue before making
                    any information public
                  </li>
                </ul>
              </p>
            </EuiText>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default SecurityPage;
