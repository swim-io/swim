import * as Sentry from "@sentry/react";
import type { ReactElement } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./App.scss";

import { AppCrashed, NewVersionAlert } from "./components/AppCrashed";
import { Layout } from "./components/Layout";
import Notification from "./components/Notification";
import { AppContext } from "./contexts";
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
      <BrowserRouter>
        <AppContext>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="set-custom-localnet"
                element={<SetCustomLocalnetPage />}
              />
              <Route path="test" element={<TestPage />} />
              <Route path="pools" element={<PoolsPage />} />
              <Route path="pools/:poolId" element={<PoolPage />} />
              <Route path="stake" element={<StakePage poolId="swimlake" />} />
              <Route path="swap" element={<SwapPage />} />
              {process.env.REACT_APP_ENABLE_NFT && (
                <Route path="otter-tots" element={<OtterTotsPage />} />
              )}
              {process.env.REACT_APP_ENABLE_NFT && (
                <Route path="redeem" element={<RedeemPage />} />
              )}
              <Route path="collectibles" element={<CollectiblesPage />} />
              <Route path="tos" element={<TosPage />} />
              <Route path="media" element={<MediaPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="security" element={<SecurityPage />} />
            </Routes>
          </Layout>
        </AppContext>
      </BrowserRouter>
      <Notification />
    </Sentry.ErrorBoundary>
  );
}

export default App;
