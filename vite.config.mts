import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

const moduleNames = ['replace_date', 'send_active', 'worker']
const tsEntryModules = moduleNames.map((name) => `/scripts/${name}.ts`)
export default defineConfig(({ mode }) => ({
    plugins: [svelte()],
    root: 'src',
    test: {
        environment: 'happy-dom',
    },
    server: { open: 'test/popup.html' },
    esbuild: {
        pure: mode === 'production' ? ['console.log'] : [],
    },
    build: {
        outDir: '../dist/chrome',
        emptyOutDir: true,
        target: ['chrome109', 'firefox128'],
        minify: false,
        cssMinify: true,
        modulePreload: false /* we don't need to preload things */,
        rollupOptions: {
            input: tsEntryModules.concat(['/popup/main.html']),
            output: {
                entryFileNames: (assetInfo) => {
                    if (moduleNames.includes(assetInfo.name)) {
                        return 'scripts/[name].js'
                    } else {
                        return 'assets/[name]-[hash].js'
                    }
                },
            },
        },
    },
    define: {
        __EXT_VERSION__: JSON.stringify(process.env.LONG_VERSION),
        __MODE__: JSON.stringify(process.env.MODE),
    },
}))
