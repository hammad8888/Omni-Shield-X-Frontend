import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const api = "http://127.0.0.1:3001";

const proxy = {
  "/api": { target: api, ws: true, changeOrigin: true },
  "/socket.io": { target: api, ws: true, changeOrigin: true },
  "/health": { target: api, changeOrigin: true },
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 8080,
    strictPort: true,
    proxy,
  },
  preview: {
    host: true,
    port: 8080,
    strictPort: true,
    proxy,
  },
});
