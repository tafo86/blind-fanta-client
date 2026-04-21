import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// Use the function syntax to access { mode }
export default defineConfig(({ mode }) => {
  // Load environment variables (like NGROK_RUNNING) from .env files
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      assetsDir: "static",
    },
    server: {
      // 1. Listen on all interfaces
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,

      // 4. WebSocket Proxy Bridge
      proxy: {
        "/ws-api": {
          target: "http://127.0.0.1:8000",
          ws: true,
          changeOrigin: true,
          secure: false,
          // This removes '/ws-api' so FastAPI sees its original route
          rewrite: (path) => path.replace(/^\/ws-api/, ""),
        },
      },
    },
  };
});