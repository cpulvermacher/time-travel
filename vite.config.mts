import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

const entryPoints = ['/content-scripts/send-active.ts', '/worker.ts'];
// get basename without extension
const scriptNames = entryPoints.map((path) => path.split('/').pop()?.split('.').shift() || '');
export default defineConfig(() => ({
    plugins: [
        svelte({
            configFile: '../svelte.config.mjs',
        }),
        paraglideVitePlugin({
            project: './project.inlang',
            outdir: './src/paraglide',
            strategy: ['baseLocale'], // locale configured via overrideGetLocale()
        }),
    ],
    root: 'src',
    test: {
        environment: 'happy-dom',
    },
    server: { open: 'test/popup.html' },
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
                        const relativePath = assetInfo.facadeModuleId?.split('/src/').pop() || '';
                        return relativePath.replace('.ts', '.js');
                    } else {
                        return 'assets/[name]-[hash].js';
                    }
                },
                minifyInternalExports: false, // since minification is off, this makes it worse
            },
        },
    },
}));
