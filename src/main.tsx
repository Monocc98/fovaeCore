import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { FovaeCoreApp } from "./FovaeCoreApp";

import { store } from "./store/store";
import { Provider } from "react-redux";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <FovaeCoreApp />
    </Provider>
  </StrictMode>
);
