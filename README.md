# OmniShield-X Frontend

Professional, high-performance network diagnostic & telemetry web application built with **React 19**, **TypeScript**, **Vite**, **TailwindCSS**, and **Socket.IO Client**.

This repository contains the standalone frontend application for OmniShield-X, designed for seamless deployment on **Vercel**.

---

## ⚡ Features

- 📊 **Real-Time Telemetry**: Live network graphs, low-latency streaming metrics, and auto-reconnecting WebSockets.
- 🚀 **Speed & Latency Diagnostics**: Real-time throughput tests, ping jitter analysis, and multi-server benchmarking.
- 🎮 **Gaming Matrix**: Round-trip time (RTT) tests and packet health indicators for major gaming platforms (PUBG, Valorant, CS2, etc.).
- 📡 **Wi-Fi & Spectrum Analyzer**: 2.4 GHz and 5 GHz channel congestion maps, signal strength meters, and BSSID inspection.
- 🛡️ **Router & Gateway Management**: Real-time DHCP leases, WAN IP tracing, LAN interface monitoring, and modem status.
- 🌐 **Vercel Ready**: Pre-configured SPA deep-linking, asset caching headers, and dynamic API endpoints.

---

## 🛠️ Tech Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 5.8
- **Build Tool**: Vite 6.2
- **Styling**: TailwindCSS 3.4, PostCSS, Autoprefixer
- **Routing**: React Router DOM 7.4
- **Real-Time**: Socket.IO Client 4.8
- **Icons**: Lucide React

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js 20+ (Node.js 22 recommended)
- npm 10+

### 2. Installation
```bash
git clone https://github.com/YOUR-USERNAME/Omni-Shield-X-Frontend.git
cd Omni-Shield-X-Frontend
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# For local development with backend running on port 3001:
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001

# For production deployment connected to Render backend:
# VITE_API_URL=https://your-backend.onrender.com
# VITE_WS_URL=https://your-backend.onrender.com
```

### 4. Development Server
```bash
npm run dev
```
The application will be running at `http://localhost:8080`.

### 5. Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🚀 Deployment to Vercel

1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Initial commit of Omni-Shield-X-Frontend"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/Omni-Shield-X-Frontend.git
   git push -u origin main
   ```

2. Open the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
3. Import the `Omni-Shield-X-Frontend` repository.
4. Set the build configuration:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. In the **Environment Variables** section, add:
   - `VITE_API_URL`: `https://YOUR-BACKEND.onrender.com`
   - `VITE_WS_URL`: `https://YOUR-BACKEND.onrender.com`
6. Click **Deploy**.

The `vercel.json` included in this repository ensures that SPA client-side routing and deep-links (e.g. `/speedtest`, `/gaming`, `/wifi`, `/router`) work cleanly on browser refresh without returning 404 errors.

---

## 🔒 Security
- This frontend contains **no** private keys, backend secrets, or database credentials.
- All backend communication is token-based via Bearer JWTs stored in browser session storage and transmitted over HTTPS/WSS.

---

## 📄 License
Private / Proprietary. All rights reserved.
