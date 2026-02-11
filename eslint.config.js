const js = require("@eslint/js");
const { FlatCompat } = require("@eslint/eslintrc");
const path = require("path");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

module.exports = [
    {
        ignores: ["dist/**", "node_modules/**", "coverage/**", "scripts/**"],
    },
    ...compat.extends("plugin:@typescript-eslint/recommended"),
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: require("@typescript-eslint/parser"),
            parserOptions: {
                project: "tsconfig.json",
                tsconfigRootDir: __dirname,
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
        },
        rules: {
             '@typescript-eslint/interface-name-prefix': 'off',
             '@typescript-eslint/explicit-function-return-type': 'off',
             '@typescript-eslint/explicit-module-boundary-types': 'off',
             '@typescript-eslint/no-explicit-any': 'off',
             '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
    },
];
