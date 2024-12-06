// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import typeormTypescriptPlugin from 'eslint-plugin-typeorm-typescript';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
    plugins: {
        'typeorm-typescript': typeormTypescriptPlugin,
    },
    rules: {
        'typeorm-typescript/enforce-column-types': [
            'error',
            // It will check bigint and decimal correctly
            { driver: 'sqlite' },
        ],
        'typeorm-typescript/enforce-relation-types': [
            'error',
            // It will force Relation<...> wrappers
            { specifyRelation: 'always' }
        ],
        'typeorm-typescript/enforce-consistent-nullability': [
            'error',
            // It will force nullable everywhere
            { specifyNullable: 'always' },
        ],
    },
});
