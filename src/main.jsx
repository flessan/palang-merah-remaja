import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.jsx";

import "./styles/tokens.css";
import "./styles/paper.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/pages.css";
import "./styles/admin.css";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
