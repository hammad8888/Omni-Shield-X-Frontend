import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";

// 10 Core Pages
import { DashboardPage } from "./pages/Dashboard";
import { SpeedTestPage } from "./pages/SpeedTest";
import { GamingPage } from "./pages/Gaming";
import { StreamingTestPage } from "./pages/StreamingTest";
import { PingTestPage } from "./pages/PingTest";
import { WiFiOverviewPage } from "./pages/WiFiOverview";
import { DevicesPage } from "./pages/Devices";
import { RouterOverviewPage } from "./pages/RouterOverview";
import { EthernetPage } from "./pages/Ethernet";
import { SettingsPage } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // 1. Dashboard
      { index: true, element: <DashboardPage /> },

      // 2. Speed Analyzer
      { path: "speedtest", element: <SpeedTestPage /> },
      { path: "speed", element: <Navigate to="/speedtest" replace /> },

      // 3. Gaming & PUBG Matrix
      { path: "gaming", element: <GamingPage /> },
      { path: "games", element: <Navigate to="/gaming" replace /> },

      // 4. Video Quality & Streaming
      { path: "streaming", element: <StreamingTestPage /> },
      { path: "streaming/video-quality", element: <Navigate to="/streaming" replace /> },
      { path: "video", element: <Navigate to="/streaming" replace /> },

      // 5. Ping & DNS Diagnostics
      { path: "ping", element: <PingTestPage /> },
      { path: "dns", element: <PingTestPage /> },

      // 6. Wi-Fi & Spectrum
      { path: "wifi", element: <WiFiOverviewPage /> },
      { path: "wifi/signal", element: <WiFiOverviewPage /> },
      { path: "wifi/networks", element: <WiFiOverviewPage /> },
      { path: "wifi/channels", element: <WiFiOverviewPage /> },
      { path: "wifi/settings", element: <Navigate to="/wifi" replace /> },

      // 7. Connected Devices
      { path: "devices", element: <DevicesPage /> },
      { path: "network", element: <Navigate to="/devices" replace /> },

      // 8. Router & Modem Hub
      { path: "router", element: <RouterOverviewPage /> },
      { path: "modem", element: <Navigate to="/router" replace /> },
      { path: "routers", element: <Navigate to="/router" replace /> },
      { path: "router/wan", element: <Navigate to="/router" replace /> },
      { path: "router/lan", element: <Navigate to="/router" replace /> },
      { path: "router/wifi", element: <Navigate to="/wifi" replace /> },
      { path: "router/dhcp", element: <Navigate to="/router" replace /> },
      { path: "router/dns", element: <Navigate to="/ping" replace /> },
      { path: "router/firewall", element: <Navigate to="/router" replace /> },
      { path: "router/devices", element: <Navigate to="/devices" replace /> },
      { path: "router/diagnostics", element: <Navigate to="/router" replace /> },

      // 9. Ethernet & Hardware
      { path: "ethernet", element: <EthernetPage /> },
      { path: "nic", element: <Navigate to="/ethernet" replace /> },

      // 10. Settings & Cloud Deploy
      { path: "settings", element: <SettingsPage /> },
      { path: "analytics", element: <Navigate to="/speedtest" replace /> },
      { path: "history", element: <Navigate to="/speedtest" replace /> },
      { path: "events", element: <Navigate to="/" replace /> },
      { path: "diagnostics", element: <Navigate to="/ping" replace /> },
      { path: "security", element: <Navigate to="/router" replace /> },
      { path: "login", element: <Navigate to="/" replace /> },

      // Fallback
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
