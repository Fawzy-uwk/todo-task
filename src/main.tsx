import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App"; // Update to .tsx if App is converted

import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import store from "./Features/store";

// Get the root element and assert its type (non-null)
const rootElement = document.getElementById("root") as HTMLElement;
const root = createRoot(rootElement);

root.render(
  <BrowserRouter>
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>
  </BrowserRouter>
);
