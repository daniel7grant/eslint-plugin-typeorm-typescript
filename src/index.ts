import { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import enforceColumnTypes from './rules/enforce-column-types.js';
import enforceConsistentNullability from './rules/enforce-consistent-nullability.js';
import enforceRelationTypes from './rules/enforce-relation-types.js';

export const rules = {
    'enforce-column-types': enforceColumnTypes,
    'enforce-consistent-nullability': enforceConsistentNullability,
    'enforce-relation-types': enforceRelationTypes,
};

export const plugin: FlatConfig.Plugin = {
    meta: {
        name: 'eslint-plugin-typeorm-typescript',
        version: '0.4.1',
    },
    rules,
};

export default plugin;
