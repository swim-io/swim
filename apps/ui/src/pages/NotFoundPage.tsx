// TODO: Sync with lokalize to support multiple languages.

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

const NotFoundPage = (): ReactElement => {
  useTitle("Not Found");
  return (
    <EuiPage className="notFoundPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiTitle>
              <h2>{"Sorry, this page isn't available"}</h2>
            </EuiTitle>
            <EuiSpacer />
            <EuiText>
              The link you followed may be broken, or the page may have been
              removed.
              <br/>
              <br/>
              Go back to the <a href={"https://swim.io"}>Swim home page</a>.
            </EuiText>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default NotFoundPage;
