module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'typeorm-typescript'],
    root: true,
    rules: {
        'typeorm-typescript/enforce-column-types': 'error',
        'typeorm-typescript/enforce-relation-types': 'error',
        'typeorm-typescript/enforce-consistent-nullability': 'error',
    },
};
