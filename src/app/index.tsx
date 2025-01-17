import "./globals.css";

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import Page from "./page";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <Page />
  </StrictMode>
);
