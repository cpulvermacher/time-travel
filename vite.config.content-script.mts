import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [],
    root: 'src',
    build: {
        lib: {
            entry: '/content-scripts/replace-date.ts',
            formats: ['iife'],
            name: 'UNUSED',
        },
        outDir: '../dist/chrome',
        emptyOutDir: false,
        target: ['chrome109', 'firefox128'],
        minify: false,
        cssMinify: true,
        modulePreload: false /* we don't need to preload things */,
        rollupOptions: {
            output: {
                entryFileNames: 'content-scripts/replace-date.js',
                minifyInternalExports: false, // since minification is off, this makes it worse
            },
        },
    },
});
