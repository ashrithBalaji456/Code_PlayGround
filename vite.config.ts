import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { javaExecutionPlugin } from './src/server/vitePluginJavaExecutor.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), javaExecutionPlugin()],
})

