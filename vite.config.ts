import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/sheets': {
        target: 'https://docs.google.com',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/sheets/,
            '/spreadsheets/d/1yzPnZUgVQ2zYp4PBndyHCXEK6Rj21TV-TbRq9h9GaBc/export?gid=0&format=csv'
          ),
      },
      '/api/youtube-oembed': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/youtube-oembed/, '/oembed'),
      },
    },
  },
})
