import * as Sentry from "@sentry/react";
import WormholePage from "pages/WormholePage";
import type { ReactElement } from "react";
import { withTranslation } from "react-i18next";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import "./App.scss";

import { AppCrashed, NewVersionAlert } from "./components/AppCrashed";
import { Layout } from "./components/Layout";
import Notification from "./components/Notification";
import WalletAutoConnect from "./components/WalletAutoConnect";
import { AppContext } from "./contexts";
import CollectiblesPage from "./pages/CollectiblesPage";
import HelpPage from "./pages/HelpPage";
import HomePage from "./pages/HomePage";
import MediaPage from "./pages/MediaPage";
import NotFoundPage from "./pages/NotFoundPage";
import PoolPage from "./pages/PoolPage";
import PoolsPage from "./pages/PoolsPage";
import SecurityPage from "./pages/SecurityPage";
import SetCustomIpPage from "./pages/SetCustomIpPage";
import StakePage from "./pages/StakePage";
import SwapPage from "./pages/SwapPage";
import SwapPageV2 from "./pages/SwapPageV2";
import TosPage from "./pages/TosPage";

function App(): ReactElement {
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
            <Routes>
              <Route path="set-custom-ip" element={<SetCustomIpPage />} />
              <Route path="pools" element={<PoolsPage />} />
              <Route path="pools/:poolId" element={<PoolPage />} />
              <Route path="stake" element={<StakePage poolId="swimlake" />} />
              <Route path="swap" element={<SwapPage />} />
              <Route
                path="swap/:fromToken/to/:toToken"
                element={<SwapPage />}
              />
              {process.env.REACT_APP_ENABLE_POOL_RESTRUCTURE && (
                <Route path="swapV2" element={<SwapPageV2 />} />
              )}
              <Route path="wormhole" element={<WormholePage />} />
              <Route path="collectibles" element={<CollectiblesPage />} />
              <Route path="tos" element={<TosPage />} />
              <Route path="media" element={<MediaPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="security" element={<SecurityPage />} />
              <Route path="/" element={<HomePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </AppContext>
      </Router>
      <Notification />
      <WalletAutoConnect />
    </Sentry.ErrorBoundary>
  );
}

// withTranslation will make sure every component under App is loaded AFTER translation is downloaded
// it is required because some functions fetch translations directly from the `i18next` instance instead of via a `useTranslation` hook. Fetching from the `i18next` instance does not wait until the translation is downloaded.
export default withTranslation()(App);
