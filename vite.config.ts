import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const resendApiKey = env.RESEND_API || env.VITE_RESEND_API || env.VITE_RESEND_API_KEY || ''
  return {
    plugins: [react()],
    define: {
      'process.env.RESEND_API': JSON.stringify(resendApiKey),
      'import.meta.env.RESEND_API': JSON.stringify(resendApiKey)
    }
  }
})

