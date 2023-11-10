import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { findDecoratorArguments, findParentClass } from '../utils/treeTraversal';
import {
    convertArgumentToRelationType,
    convertTypeToRelationType,
    Relation,
    relationTypes,
    isTypesEqual,
    typeToString,
} from '../utils/relationType';

const createRule = ESLintUtils.RuleCreator((name) => name);

const enforceColumnTypes = createRule({
    name: 'enforce-relation-types',
    defaultOptions: [],
    meta: {
        type: 'problem',
        docs: {
            description: 'TypeScript types should be consistent with the relations.',
            recommended: 'error',
        },
        hasSuggestions: true,
        messages: {
            typescript_typeorm_relation_mismatch:
                'Type of {{ propertyName }}{{ className }} is not consistent with the TypeORM relation type {{ relation }}{{ expectedValue }}.',
            typescript_typeorm_relation_suggestion:
                'Change the type of {{ propertyName }} to {{ expectedValue }}.',
        },
        schema: [],
    },
    create(context) {
        return {
            PropertyDefinition(node) {
                const relationsArguments = relationTypes.map(
                    (relation): [Relation, TSESTree.CallExpressionArgument[] | undefined] => [
                        relation,
                        findDecoratorArguments(node.decorators, relation),
                    ]
                );
                const relationArguments = relationsArguments.find(([, args]) => args);
                if (!relationArguments) {
                    return;
                }

                const [relation, relArguments] = relationArguments;
                const typeormType = convertArgumentToRelationType(relation, relArguments);

                if (!node.typeAnnotation) {
                    return;
                }
                const { typeAnnotation } = node.typeAnnotation;
                const typescriptType = convertTypeToRelationType(typeAnnotation);

                if (!isTypesEqual(typeormType, typescriptType)) {
                    const fixReplace = typeToString(typeormType);

                    // Construct strings for error message
                    const propertyName =
                        node.key?.type === AST_NODE_TYPES.Identifier ? node.key.name : 'property';
                    const classObject = findParentClass(node);
                    const className = classObject?.id ? ` in ${classObject.id.name}` : '';
                    const expectedValue = fixReplace ? ` (expected type: ${fixReplace})` : '';

                    // Report the error
                    context.report({
                        node,
                        messageId: 'typescript_typeorm_relation_mismatch',
                        data: {
                            className,
                            propertyName,
                            expectedValue,
                            relation,
                        },
                        suggest: fixReplace
                            ? [
                                  {
                                      messageId: 'typescript_typeorm_relation_suggestion',
                                      fix: (fixer) => fixer.replaceText(typeAnnotation, fixReplace),
                                      data: {
                                          propertyName,
                                          expectedValue: fixReplace,
                                      },
                                  },
                              ]
                            : undefined,
                        loc: node.loc,
                    });
                }
            },
        };
    },
});

export default enforceColumnTypes;
