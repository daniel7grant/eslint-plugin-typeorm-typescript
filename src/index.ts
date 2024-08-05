import { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import enforceColumnTypes from './rules/enforce-column-types.js';
import enforceConsistentNullability from './rules/enforce-consistent-nullability.js';
import enforceRelationTypes from './rules/enforce-relation-types.js';
import recommended from './recommended.js';

export const rules = {
    'enforce-column-types': enforceColumnTypes,
    'enforce-consistent-nullability': enforceConsistentNullability,
    'enforce-relation-types': enforceRelationTypes,
};

export const plugin: FlatConfig.Plugin = {
    meta: {
        name: 'eslint-plugin-typeorm-typescript',
        version: '0.3.0',
    },
    rules,
};

export { recommended };

export default plugin;
