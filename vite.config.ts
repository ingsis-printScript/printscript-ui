import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const backendUrl = env.VITE_BACKEND_URL;

  return {
    define: {
      'process.env.FRONTEND_URL': JSON.stringify(env.FRONTEND_URL),
      'process.env.BACKEND_URL': JSON.stringify(env.BACKEND_URL)
    },
    plugins: [react()],
    server: {
      proxy: {
        '/api/snippet-service': {
          target: backendUrl,
          changeOrigin: true,
          secure: true,
        }
      }
    }
  }
})
