import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

const CURRENT_BUILD_TIME = Date.now().toString()

function ceovaVersionPlugin(): Plugin {
  return {
    name: 'ceova-version-plugin',
    closeBundle() {
      try {
        const outDir = path.resolve(process.cwd(), 'dist')
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
        fs.writeFileSync(
          path.join(outDir, 'version.json'),
          JSON.stringify({
            version: '2.0.0',
            buildTime: CURRENT_BUILD_TIME,
            releaseName: 'CEOVA-Admin-Portal-v2.0.0',
            updatedAt: new Date().toISOString()
          }, null, 2)
        )
      } catch (e) {
        console.error('Failed to write version.json:', e)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const resendApiKey = env.RESEND_API || env.VITE_RESEND_API || env.VITE_RESEND_API_KEY || ''
  return {
    plugins: [react(), ceovaVersionPlugin()],
    define: {
      'process.env.RESEND_API': JSON.stringify(resendApiKey),
      'import.meta.env.RESEND_API': JSON.stringify(resendApiKey),
      __APP_BUILD_TIME__: JSON.stringify(CURRENT_BUILD_TIME),
      __APP_VERSION__: JSON.stringify('2.0.0')
    }
  }
})
