import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./app/store";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./index.scss";

const SWSearchParams = new URLSearchParams(
  `pathname=${window.location.pathname}`
);

try {
  if (
    typeof (document.currentScript as HTMLScriptElement | null)?.src !==
    "undefined"
  ) {
    const currentScriptURL = new URL(
      (document.currentScript as HTMLScriptElement).src
    );
    Array.from(currentScriptURL.searchParams.entries()).forEach(
      ([key, value]) => {
        if (!value) SWSearchParams.set("rand", key);
      }
    );
  }
} catch {}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(
        `${window.location.pathname}service_worker.js?${SWSearchParams}`
      )
      .catch((registrationError) => {
        console.error("SW registration failed: ", registrationError);
      });
  });
}

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
