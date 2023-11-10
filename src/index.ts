/* eslint-disable import/prefer-default-export */
import enforceColumnTypes from './rules/enforce-column-types';
import enforceRelationTypes from './rules/enforce-relation-types';

export const rules = {
    'enforce-column-types': enforceColumnTypes,
    'enforce-relation-types': enforceRelationTypes,
};
