import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { FovaeCoreApp } from "./FovaeCoreApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FovaeCoreApp />
  </StrictMode>
);
