import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/' : '/ESchedular26/',
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/*.pdf']
    }
  }
}))
