import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/out", "**/dist", "**/*.d.ts"],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
).map(config => ({
    ...config,
    files: ["**/*.ts", "**/*.mts"],
})), {
    files: ["**/*.ts", "**/*.mts"],

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 6,
        sourceType: "module",
    },

    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            selector: "import",
            format: ["camelCase", "PascalCase"],
        }],
        curly: "warn",
        eqeqeq: "warn",
        "no-throw-literal": "warn",
        "no-restricted-imports": ["warn", {
            paths: [{
                // allowed only in extension.ts and config.ts, since it cannot be imported in unit tests.
                name: 'vscode',
                message: "Importing 'vscode' is restricted except for type imports.",
                importNames: ['default'],
            }],
        }]
    },
}];