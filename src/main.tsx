import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AuthProvider } from "./auth";
import { PrefsProvider } from "./prefs";
import { RealtimeProvider } from "./realtime";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <PrefsProvider>
        <RealtimeProvider>
          <App />
        </RealtimeProvider>
      </PrefsProvider>
    </AuthProvider>
  </StrictMode>
);
