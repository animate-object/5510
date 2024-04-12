import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";
import { DirectionArrowProvider } from "./modules/display/DirectionArrowProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DirectionArrowProvider>
      <App />
    </DirectionArrowProvider>
  </React.StrictMode>
);
