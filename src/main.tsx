import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";
import { FlagProvider } from "./modules/common/flags/FlagContext.tsx";
import { initGlobalLogger } from "./modules/common/log.ts";

initGlobalLogger();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FlagProvider>
      <App />
    </FlagProvider>
  </React.StrictMode>
);
