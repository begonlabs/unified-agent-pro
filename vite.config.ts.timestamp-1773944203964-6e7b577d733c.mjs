// vite.config.ts
import { defineConfig } from "file:///C:/Users/sarki/OneDrive/Escritorio/Antigravety/ondai/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/sarki/OneDrive/Escritorio/Antigravety/ondai/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/sarki/OneDrive/Escritorio/Antigravety/ondai/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\sarki\\OneDrive\\Escritorio\\Antigravety\\ondai";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Asegurar que los archivos estáticos se copien correctamente
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "favicon.ico") {
            return "favicon.ico";
          }
          return "assets/[name]-[hash][extname]";
        }
      }
    },
    // Asegurar que los archivos de public se copien correctamente
    copyPublicDir: true
  },
  // Configuración para copiar archivos estáticos
  publicDir: "public"
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzYXJraVxcXFxPbmVEcml2ZVxcXFxFc2NyaXRvcmlvXFxcXEFudGlncmF2ZXR5XFxcXG9uZGFpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzYXJraVxcXFxPbmVEcml2ZVxcXFxFc2NyaXRvcmlvXFxcXEFudGlncmF2ZXR5XFxcXG9uZGFpXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9zYXJraS9PbmVEcml2ZS9Fc2NyaXRvcmlvL0FudGlncmF2ZXR5L29uZGFpL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXHJcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gQXNlZ3VyYXIgcXVlIGxvcyBhcmNoaXZvcyBlc3RcdTAwRTF0aWNvcyBzZSBjb3BpZW4gY29ycmVjdGFtZW50ZVxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xyXG4gICAgICAgICAgLy8gTWFudGVuZXIgZWwgbm9tYnJlIG9yaWdpbmFsIHBhcmEgZmF2aWNvbi5pY29cclxuICAgICAgICAgIGlmIChhc3NldEluZm8ubmFtZSA9PT0gJ2Zhdmljb24uaWNvJykge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2Zhdmljb24uaWNvJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiAnYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8vIEFzZWd1cmFyIHF1ZSBsb3MgYXJjaGl2b3MgZGUgcHVibGljIHNlIGNvcGllbiBjb3JyZWN0YW1lbnRlXHJcbiAgICBjb3B5UHVibGljRGlyOiB0cnVlXHJcbiAgfSxcclxuICAvLyBDb25maWd1cmFjaVx1MDBGM24gcGFyYSBjb3BpYXIgYXJjaGl2b3MgZXN0XHUwMEUxdGljb3NcclxuICBwdWJsaWNEaXI6ICdwdWJsaWMnLFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFYsU0FBUyxvQkFBb0I7QUFDelgsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUNULGdCQUFnQjtBQUFBLEVBQ2xCLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBQUEsSUFFTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixnQkFBZ0IsQ0FBQyxjQUFjO0FBRTdCLGNBQUksVUFBVSxTQUFTLGVBQWU7QUFDcEMsbUJBQU87QUFBQSxVQUNUO0FBQ0EsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsZUFBZTtBQUFBLEVBQ2pCO0FBQUE7QUFBQSxFQUVBLFdBQVc7QUFDYixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
