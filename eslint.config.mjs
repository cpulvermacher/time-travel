import eslint from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import svelteConfig from './svelte.config.mjs';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
    {
        ignores: ['out', 'dist', '**/*.d.ts', 'src/paraglide']
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...svelte.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['eslint.config.mjs'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/naming-convention": ["warn", {
                selector: "import",
                format: ["camelCase", "PascalCase"],
            }],
            curly: "warn",
            eqeqeq: "warn",
            "no-throw-literal": "warn",
        },
    },
    {
        files: ["src/test/unit/**/*.ts"],
        rules: {
            "@typescript-eslint/unbound-method": "off"
        }
    },
    {
        files: ['**/*.svelte', '**/*.svelte.ts'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                extraFileExtensions: ['.svelte'], // Add support for additional file extensions, such as .svelte
                parser: tseslint.parser,
                svelteConfig
            }
        }
    },
    {
        rules: {
            "svelte/no-at-html-tags": "off"
        }
    }
)
