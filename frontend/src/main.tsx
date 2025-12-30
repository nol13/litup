import React from "react";
import ReactDOM from "react-dom/client";
import { Buffer } from "buffer";
import { AppProviders } from "./providers";
import App from "./App";
import "./styles.css";

// Ensure Buffer exists in browser for Bundlr
if (!(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

const root = document.getElementById("root");

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>
  );
}
