import { StrictMode, Suspense } from "react";
import ReactDOM from "react-dom";

import "./index.css";
import "./euiIcons";
import "./i18n";
import App from "./App";
import { setupSentry } from "./errors/sentry";
import reportWebVitals from "./reportWebVitals";

setupSentry();

ReactDOM.render(
  <StrictMode>
    {/* Needed for i18next */}
    <Suspense fallback="Loading…">
      <App />
    </Suspense>
  </StrictMode>,
  document.getElementById("root"),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
