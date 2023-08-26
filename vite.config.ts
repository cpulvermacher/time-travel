import { defineConfig } from 'vitest/config'

const moduleNames = ['replace_date', 'send_active', 'sw-chrome']
const tsEntryModules = moduleNames.map(name => `/scripts/${name}.ts`)
export default defineConfig(({ mode }) => ({
    root: 'src',
    test: {
        environment: 'happy-dom'
    },
    esbuild: {
        pure: mode === 'production' ? ['console.log'] : [],
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'chrome96',
        minify: false,
        rollupOptions: {
            input: tsEntryModules.concat(['/popup/popup.html']),
            output: {
                entryFileNames: assetInfo => {
                    if (moduleNames.includes(assetInfo.name)) {
                        return 'scripts/[name].js'
                    } else {
                        return 'assets/[name]-[hash].js'
                    }
                }
            }
        },
    },
    define: {
        '__EXT_VERSION__': JSON.stringify(process.env.LONG_VERSION)
    }
}))