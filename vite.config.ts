import { defineConfig } from 'vitest/config'

export default defineConfig({
    root: 'src',
    test: {
        environment: 'happy-dom'
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'chrome96',
        // minify: false,
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