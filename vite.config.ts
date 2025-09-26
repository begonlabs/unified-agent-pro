import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Asegurar que los archivos estáticos se copien correctamente
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Mantener el nombre original para favicon.ico
          if (assetInfo.name === 'favicon.ico') {
            return 'favicon.ico';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  // Configuración para copiar archivos estáticos
  publicDir: 'public',
}));
