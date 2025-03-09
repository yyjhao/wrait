import * as ReactDOM from "react-dom/client";
import { Main } from "./combini/components/Main";
import * as React from "react";
import "./combini/CombiniSetup.css";

const container = document.getElementById("root") as HTMLDivElement;
const root = ReactDOM.createRoot(container);

root.render(<Main />);
