import { EuiButton, EuiEmptyPrompt, EuiPage, EuiPageBody } from "@elastic/eui";
import type { ReactElement } from "react";

export const AppCrashed = (): ReactElement => {
  return (
    <EuiPage restrictWidth>
      <EuiPageBody>
        <EuiEmptyPrompt
          color="danger"
          iconType="alert"
          title={<h2>Oh snap!</h2>}
          body={
            "Something went wrong but our developers have been alerted. Your funds are safe. If you have ongoing interactions you can resume them from where you left off."
          }
          actions={
            <EuiButton onClick={() => window.location.reload()} fill>
              Reload page
            </EuiButton>
          }
        />
      </EuiPageBody>
    </EuiPage>
  );
};

export const NewVersionAlert = (): ReactElement => {
  return (
    <EuiPage restrictWidth>
      <EuiPageBody>
        <EuiEmptyPrompt
          color="primary"
          iconType="refresh"
          title={<h2>New version available</h2>}
          body={
            "There is a new version of the app available. Please reload the page to continue using the app."
          }
          actions={
            <EuiButton onClick={() => window.location.reload()} fill>
              Reload page
            </EuiButton>
          }
        />
      </EuiPageBody>
    </EuiPage>
  );
};
