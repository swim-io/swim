import * as Sentry from "@sentry/react";
import type { ReactElement } from "react";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";

import "./App.scss";

import { AppCrashed, NewVersionAlert } from "./components/AppCrashed";
import { Layout } from "./components/Layout";
import Notification from "./components/Notification";
import { AppContext } from "./contexts";
import { useWalletAutoConnect } from "./hooks";
import CollectiblesPage from "./pages/CollectiblesPage";
import HelpPage from "./pages/HelpPage";
import HomePage from "./pages/HomePage";
import MediaPage from "./pages/MediaPage";
import OtterTotsPage from "./pages/OtterTotsPage";
import PoolPage from "./pages/PoolPage";
import PoolsPage from "./pages/PoolsPage";
import RedeemPage from "./pages/RedeemPage";
import SecurityPage from "./pages/SecurityPage";
import SetCustomLocalnetPage from "./pages/SetCustomLocalnetPage";
import StakePage from "./pages/StakePage";
import SwapPage from "./pages/SwapPage";
import TestPage from "./pages/TestPage";
import TosPage from "./pages/TosPage";

function App(): ReactElement {
  useWalletAutoConnect();

  return (
    <Sentry.ErrorBoundary
      fallback={({ error }) => {
        if (error.message.includes("ChunkLoadError")) {
          return <NewVersionAlert />;
        }

        return <AppCrashed />;
      }}
      showDialog={false}
      dialogOptions={{
        // These are required by Sentry but we don't want to show them
        user: { name: "Anonymous", email: "anonymous@example.org" },
      }}
      onError={(error, componentStack, eventId) => {
        if (!error.message.includes("ChunkLoadError")) {
          Sentry.showReportDialog({
            eventId: eventId,
            user: { name: "Anonymous", email: "anonymous@example.org" },
          });
        }
      }}
    >
      <Router>
        <AppContext>
          <Layout>
            <Switch>
              <Route path="/set-custom-localnet">
                <SetCustomLocalnetPage />
              </Route>
              <Route path="/test">
                <TestPage />
              </Route>
              <Route exact path="/pools">
                <PoolsPage />
              </Route>
              <Route path="/pools/:poolId">
                <PoolPage />
              </Route>
              <Route path="/stake">
                <StakePage poolId="swimlake" />
              </Route>
              <Route path="/swap">
                <SwapPage />
              </Route>
              {process.env.REACT_APP_ENABLE_NFT && (
                <Route exact path="/otter-tots">
                  <OtterTotsPage />
                </Route>
              )}
              {process.env.REACT_APP_ENABLE_NFT && (
                <Route path="/redeem">
                  <RedeemPage />
                </Route>
              )}
              <Route path="/collectibles">
                <CollectiblesPage />
              </Route>
              <Route path="/tos">
                <TosPage />
              </Route>
              <Route path="/media">
                <MediaPage />
              </Route>
              <Route path="/help">
                <HelpPage />
              </Route>
              <Route path="/security">
                <SecurityPage />
              </Route>
              <Route path="/">
                <HomePage />
              </Route>
            </Switch>
          </Layout>
        </AppContext>
      </Router>
      <Notification />
    </Sentry.ErrorBoundary>
  );
}

export default App;
