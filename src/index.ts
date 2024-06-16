import enforceColumnTypes from './rules/enforce-column-types';
import enforceConsistentNullability from './rules/enforce-consistent-nullability';
import enforceRelationTypes from './rules/enforce-relation-types';

export const rules = {
    'enforce-column-types': enforceColumnTypes,
    'enforce-consistent-nullability': enforceConsistentNullability,
    'enforce-relation-types': enforceRelationTypes,
};
