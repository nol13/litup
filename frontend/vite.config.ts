import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      crypto: "crypto-browserify",
      stream: "stream-browserify",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          wallet: ["@coinbase/onchainkit", "wagmi", "viem"],
          lit: ["@lit-protocol/lit-node-client", "@lit-protocol/encryption"],
          irys: ["@irys/web-upload", "@irys/web-upload-ethereum-viem-v2"],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
