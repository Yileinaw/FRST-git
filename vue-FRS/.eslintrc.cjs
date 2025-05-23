/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
    root: true,
    extends: [
        'plugin:vue/vue3-essential',
        'eslint:recommended',
        '@vue/eslint-config-typescript/recommended',
        '@vue/eslint-config-prettier',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
    },
    rules: {
        // 在这里添加或覆盖规则
    },
}; 