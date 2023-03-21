import { defineConfig } from 'vite'

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'chrome100',
        rollupOptions: {
            input: ['/popup/popup.html'],
            output: {
            }
        }
    },
})