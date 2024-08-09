import { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import { plugin } from './index.js';

const config: FlatConfig.Config = {
    plugins: {
        'typeorm-typescript': plugin,
    },
    rules: {
        'typeorm-typescript/enforce-column-types': 'error',
        'typeorm-typescript/enforce-relation-types': 'error',
        'typeorm-typescript/enforce-consistent-nullability': 'error',
    },
};

export default config;
