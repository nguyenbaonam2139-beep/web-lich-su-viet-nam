import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "./demo-polish.css";
import "./knowledge-layout.css";
import "./locked-progression.css";
import "./visual-novel.css";
import "./knowledge-sections.css";
import "./milestone-completion.css";
import "./milestone-celebration.css";
import "./character-guess.css";
import "./admin-mode.css";
import { AdminProvider } from "./contexts/AdminContext";
import { ContentProvider } from "./contexts/ContentContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ContentProvider>
      <App />
    </ContentProvider>
  </React.StrictMode>
);


