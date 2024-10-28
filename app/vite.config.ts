import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
// import { visualizer } from 'rollup-plugin-visualizer'
// import mkcert from 'vite-plugin-mkcert'
// import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  base: '/willow-app/',
})
