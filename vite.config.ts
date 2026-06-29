import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import fs from "fs"
import tailwindcss from "@tailwindcss/vite"

const httpsKeyPath = path.resolve(__dirname, ".certs/localhost-key.pem");
const httpsCertPath = path.resolve(__dirname, ".certs/localhost.pem");
const hasHttpsFiles = fs.existsSync(httpsKeyPath) && fs.existsSync(httpsCertPath);

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
      host: "localhost",
      port: 5173,
      https: hasHttpsFiles
        ? {
            key: fs.readFileSync(httpsKeyPath),
            cert: fs.readFileSync(httpsCertPath),
          }
        : undefined,
      proxy: {
        '/api': {
          // El servidor en 216.250.124.244:81 responde en HTTP, no HTTPS.
          // Usar HTTPS aquí provoca el error "wrong version number".
          target: 'http://216.250.124.244:81',
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
})
