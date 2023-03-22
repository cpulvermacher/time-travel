import { defineConfig } from 'vite'

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'chrome100',
        rollupOptions: {
            input: ['/background.ts', '/popup/popup.html'],
            output: {
                entryFileNames: assetInfo =>
                    assetInfo.name === 'background' ? '[name].js' : 'assets/[name]-[hash].js',
            }
        }
    },
})