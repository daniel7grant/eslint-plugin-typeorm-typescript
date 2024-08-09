import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import {
    findEitherDecoratorArguments,
    findParentClass,
    parseObjectLiteral,
} from '../utils/treeTraversal.js';

type ErrorMessages =
    | 'typescript_typeorm_missing_nullability'
    | 'typescript_typeorm_superfluous_nullability'
    | 'typescript_typeorm_set_nullable'
    | 'typescript_typeorm_remove_nullable';
type SpecifyNullability = 'always' | 'non-default';
type Options = [
    {
        specifyNullable: SpecifyNullability;
    },
];

const createRule = ESLintUtils.RuleCreator(
    (name) =>
        `https://github.com/daniel7grant/eslint-plugin-typeorm-typescript#typeorm-typescript${name}`,
);

const enforceConsistentNullability = createRule<Options, ErrorMessages>({
    name: 'enforce-consistent-nullability',
    defaultOptions: [{ specifyNullable: 'non-default' }],
    meta: {
        type: 'problem',
        docs: {
            description: 'TypeORM nullability should be consistent.',
        },
        hasSuggestions: true,
        messages: {
            typescript_typeorm_missing_nullability:
                'The nullability of {{ propertyName }}{{ className }} should be set to the default value{{ expectedValue }} to avoid confusion.',
            typescript_typeorm_superfluous_nullability:
                'The nullability of {{ propertyName }}{{ className }} matches the default value, you can freely remove it.',
            typescript_typeorm_set_nullable:
                'Set nullable to default value {{ expectedValue }} on {{ propertyName }}{{ className }}.',
            typescript_typeorm_remove_nullable:
                'Remove nullable from {{ propertyName }}{{ className }}.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    specifyNullable: {
                        type: 'string',
                        enum: ['always', 'non-default'],
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    create(context, [{ specifyNullable }]) {
        return {
            PropertyDefinition(node) {
                const columnArguments = findEitherDecoratorArguments(node.decorators, [
                    'Column',
                    'PrimaryColumn',
                    'CreateDateColumn',
                    'UpdateDateColumn',
                    'DeleteDateColumn',
                    'VersionColumn',
                    'OneToOne',
                    'ManyToOne',
                ]);
                if (!columnArguments) {
                    return;
                }

                const [decoratorName, decoratorArguments] = columnArguments;
                const defaultNullability =
                    decoratorName === 'OneToOne' || decoratorName === 'ManyToOne';

                const argumentNode = decoratorArguments.find(
                    (arg): arg is TSESTree.ObjectExpression =>
                        arg.type === AST_NODE_TYPES.ObjectExpression,
                );
                const { nullable } = parseObjectLiteral(argumentNode);

                if (
                    (specifyNullable === 'always' && nullable === undefined) ||
                    (specifyNullable === 'non-default' && nullable === defaultNullability)
                ) {
                    // Construct strings for error message
                    const reportedNode = argumentNode ?? decoratorArguments[0]?.parent ?? node;
                    const propertyName =
                        node.key?.type === AST_NODE_TYPES.Identifier ? node.key.name : 'property';
                    const classObject = findParentClass(node);
                    const className = classObject?.id ? ` in ${classObject.id.name}` : '';
                    const expectedValue =
                        specifyNullable === 'always'
                            ? ` ({ nullable: ${defaultNullability} })`
                            : '';

                    // Report the error
                    context.report({
                        node: reportedNode,
                        messageId:
                            specifyNullable === 'always'
                                ? 'typescript_typeorm_missing_nullability'
                                : 'typescript_typeorm_superfluous_nullability',
                        data: {
                            className,
                            propertyName,
                            expectedValue,
                        },
                        suggest: [
                            {
                                messageId:
                                    specifyNullable === 'always'
                                        ? 'typescript_typeorm_set_nullable'
                                        : 'typescript_typeorm_remove_nullable',
                                fix: (fixer) => {
                                    // specifyNullable === 'always', add nullable property
                                    // There is no options object
                                    if (!argumentNode) {
                                        if (decoratorArguments.length >= 1) {
                                            return fixer.insertTextAfter(
                                                decoratorArguments[decoratorArguments.length - 1],
                                                `, { nullable: ${defaultNullability} }`,
                                            );
                                        }

                                        const decorator = node.decorators.find(
                                            (d) =>
                                                d.expression.type ===
                                                    AST_NODE_TYPES.CallExpression &&
                                                d.expression.callee.type ===
                                                    AST_NODE_TYPES.Identifier &&
                                                d.expression.callee.name === decoratorName,
                                        );

                                        if (!decorator) {
                                            throw new Error(`Decorator ${decoratorName} failed.`);
                                        }

                                        return fixer.insertTextAfterRange(
                                            [decorator.range[0], decorator.range[1] - 1],
                                            `{ nullable: ${defaultNullability} }`,
                                        );
                                    }

                                    // There is an options object, but no nullability
                                    if (specifyNullable === 'always') {
                                        if (argumentNode.properties.length >= 1) {
                                            return fixer.insertTextAfter(
                                                argumentNode.properties[
                                                    argumentNode.properties.length - 1
                                                ],
                                                `, nullable: ${defaultNullability}`,
                                            );
                                        }
                                        return fixer.insertTextAfterRange(
                                            [argumentNode.range[0], argumentNode.range[1] - 1],
                                            ` nullable: ${defaultNullability} `,
                                        );
                                    }

                                    // specifyNullable === 'non-default', remove nullable property
                                    // There is a properties object only with one property (remove whole object)
                                    if (argumentNode.properties.length === 1) {
                                        const index = decoratorArguments.findIndex(
                                            (arg) => arg === argumentNode,
                                        );

                                        // Remove object and previous comma as well
                                        if (index >= 1) {
                                            return fixer.removeRange([
                                                decoratorArguments[index - 1].range[1],
                                                argumentNode.range[1],
                                            ]);
                                        }

                                        // Remove only the object
                                        return fixer.remove(argumentNode);
                                    }

                                    // Find the index of the nullable prop to remove
                                    const index = argumentNode.properties.findIndex(
                                        (prop) =>
                                            prop.type === AST_NODE_TYPES.Property &&
                                            prop.key.type === AST_NODE_TYPES.Identifier &&
                                            prop.key.name === 'nullable',
                                    );
                                    // Remove property and previous comma
                                    if (index >= 1) {
                                        return fixer.removeRange([
                                            argumentNode.properties[index - 1].range[1],
                                            argumentNode.properties[index].range[1],
                                        ]);
                                    }
                                    // Remove property and next comma
                                    return fixer.removeRange([
                                        argumentNode.properties[index].range[0],
                                        argumentNode.properties[index + 1].range[0],
                                    ]);
                                },
                                data: {
                                    className,
                                    propertyName,
                                    expectedValue,
                                },
                            },
                        ],
                        loc: reportedNode.loc,
                    });
                }
            },
        };
    },
});

export default enforceConsistentNullability;
