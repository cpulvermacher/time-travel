import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

const entryPoints = ['/content-scripts/replace-date.ts', '/content-scripts/send-active.ts', '/worker.ts']
// get basename without extension
const scriptNames = entryPoints.map((path) => path.split('/').pop()?.split('.').shift() || '')
export default defineConfig(({ mode }) => ({
    plugins: [
        svelte(),
        paraglideVitePlugin({
            project: './project.inlang',
            outdir: './src/paraglide',
            strategy: ['preferredLanguage', 'baseLocale'],
        }),
    ],
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
            input: entryPoints.concat(['/popup/main.html']),
            output: {
                entryFileNames: (assetInfo) => {
                    if (scriptNames.includes(assetInfo.name)) {
                        // retain original path (e.g. src/content-scripts/abc.ts -> src/content-scripts/abc.js)
                        const relativePath = assetInfo.facadeModuleId?.split('/src/').pop() || ''
                        return relativePath.replace('.ts', '.js')
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
