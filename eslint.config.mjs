import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['out', 'dist', '**/*.d.ts', 'src/paraglide']
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
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
)
