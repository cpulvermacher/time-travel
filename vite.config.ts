import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        target: 'chrome100',
        rollupOptions: {
            input: ['popup/popup.html'],
            output: {
            }
        }
    },
})