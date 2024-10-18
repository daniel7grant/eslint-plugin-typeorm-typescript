import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { ReportSuggestionArray } from '@typescript-eslint/utils/ts-eslint';
import {
    findEitherDecoratorArguments,
    findObjectArgument,
    findParentClass,
} from '../utils/treeTraversal.js';
import {
    convertArgumentToRelationType,
    convertTypeToRelationType,
    isTypesEqual,
    typeToString,
    isTypeMissingNullable,
    isTypeMissingArray,
} from '../utils/relationType.js';

const createRule = ESLintUtils.RuleCreator(
    (name) =>
        `https://github.com/daniel7grant/eslint-plugin-typeorm-typescript#typeorm-typescript${name}`,
);

type EnforceColumnMessages =
    | 'typescript_typeorm_relation_missing'
    | 'typescript_typeorm_relation_mismatch'
    | 'typescript_typeorm_relation_array_to_many'
    | 'typescript_typeorm_relation_nullable_by_default'
    | 'typescript_typeorm_relation_suggestion'
    | 'typescript_typeorm_relation_nullable_by_default_suggestion';

const enforceColumnTypes = createRule({
    name: 'enforce-relation-types',
    defaultOptions: [],
    meta: {
        type: 'problem',
        docs: {
            description: 'TypeScript types should be consistent with the relations.',
        },
        hasSuggestions: true,
        messages: {
            typescript_typeorm_relation_missing:
                'Relation {{ relation }} of {{ propertyName }}{{ className }} does not have an arrow function with the relation type.',
            typescript_typeorm_relation_mismatch:
                'Type of {{ propertyName }}{{ className }} is not consistent with the TypeORM relation type {{ relation }}{{ expectedValue }}.',
            typescript_typeorm_relation_array_to_many:
                '{{ relation }} relations return multiple entities. Type of {{ propertyName }}{{ className }} should be an array {{ expectedValue }}.',
            typescript_typeorm_relation_nullable_by_default:
                'TypeORM relations are nullable by default. Type of {{ propertyName }}{{ className }} should be nullable{{ expectedValue }}.',
            typescript_typeorm_relation_suggestion:
                'Change the type of {{ propertyName }} to {{ expectedValue }}.',
            typescript_typeorm_relation_nullable_by_default_suggestion:
                'Make the {{ relation }} relation nullable: false.',
        },
        schema: [],
    },
    create(context) {
        let relationWrapperAlias: string | undefined;

        return {
            ImportDeclaration(node) {
                if (node.source.value !== 'typeorm') return;

                for (const specifier of node.specifiers) {
                    if (specifier.type !== TSESTree.AST_NODE_TYPES.ImportSpecifier) continue;
                    const { imported } = specifier;
                    if (imported.name === 'Relation') {
                        relationWrapperAlias = specifier.local.name;
                        return;
                    }
                }
            },
            PropertyDefinition(node) {
                const relationArguments = findEitherDecoratorArguments(node.decorators, [
                    'OneToOne',
                    'OneToMany',
                    'ManyToOne',
                    'ManyToMany',
                ]);
                if (!relationArguments) {
                    return;
                }

                const [relation, relArguments] = relationArguments;
                const typeormType = convertArgumentToRelationType(relation, relArguments);
                if (!typeormType) {
                    const propertyName =
                        node.key?.type === AST_NODE_TYPES.Identifier ? node.key.name : 'property';
                    const classObject = findParentClass(node);
                    const className = classObject?.id ? ` in ${classObject.id.name}` : '';
                    context.report({
                        node,
                        messageId: 'typescript_typeorm_relation_missing',
                        data: {
                            className,
                            propertyName,
                            relation,
                        },
                        loc: node.loc,
                    });
                    return;
                }

                if (!node.typeAnnotation) {
                    return;
                }
                const { typeAnnotation } = node.typeAnnotation;
                const typescriptType = convertTypeToRelationType(
                    typeAnnotation,
                    relationWrapperAlias,
                );

                if (!isTypesEqual(typeormType, typescriptType)) {
                    let messageId: EnforceColumnMessages = 'typescript_typeorm_relation_mismatch';
                    const suggestions: ReportSuggestionArray<EnforceColumnMessages> = [];
                    const fixReplace = typeToString(typeormType, typescriptType);

                    // Construct strings for error message
                    const propertyName =
                        node.key?.type === AST_NODE_TYPES.Identifier ? node.key.name : 'property';
                    const classObject = findParentClass(node);
                    const className = classObject?.id ? ` in ${classObject.id.name}` : '';
                    const expectedValue = fixReplace ? ` (expected type: ${fixReplace})` : '';
                    if (fixReplace) {
                        suggestions.push({
                            messageId: 'typescript_typeorm_relation_suggestion',
                            fix: (fixer) => fixer.replaceText(typeAnnotation, fixReplace),
                            data: {
                                propertyName,
                                expectedValue: fixReplace,
                            },
                        });
                    }

                    // Arrays are required for ToMany types, help with a custom message
                    if (isTypeMissingArray(typeormType, typescriptType)) {
                        messageId = 'typescript_typeorm_relation_array_to_many';
                    }

                    // Relations are nullable by default which can be confusing, help with a custom message
                    if (relArguments && isTypeMissingNullable(typeormType, typescriptType)) {
                        messageId = 'typescript_typeorm_relation_nullable_by_default';
                        const options = findObjectArgument(relArguments);
                        if (!options) {
                            const lastArgument = relArguments[relArguments.length - 1];
                            suggestions.push({
                                messageId:
                                    'typescript_typeorm_relation_nullable_by_default_suggestion',
                                fix: (fixer) =>
                                    fixer.insertTextAfter(lastArgument, ', { nullable: false }'),
                                data: {
                                    relation,
                                },
                            });
                        }
                    }

                    // Report the error
                    context.report({
                        node,
                        messageId,
                        data: {
                            className,
                            propertyName,
                            expectedValue,
                            relation,
                        },
                        suggest: suggestions,
                        loc: node.loc,
                    });
                }
            },
        };
    },
});

export default enforceColumnTypes;
