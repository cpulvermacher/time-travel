import { defineConfig } from 'vite'

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'chrome100',
        rollupOptions: {
            input: ['/background.ts', '/popup/popup.html', '/scripts/replace_date.ts'],
            output: {
                entryFileNames: assetInfo => {
                    if (assetInfo.name === 'background') {
                        return '[name].js'
                    } else if (assetInfo.name === 'replace_date') {
                        return 'scripts/[name].js'
                    } else {
                        return 'assets/[name]-[hash].js'
                    }
                }
            }
        },
    }
})