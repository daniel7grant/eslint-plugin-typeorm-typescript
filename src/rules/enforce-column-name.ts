import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import {
    findEitherDecoratorArguments,
    findObjectArgument,
    findParentClass,
} from '../utils/treeTraversal.js';

type Prefer = 'snake_case' | 'lowerCamelCase';
type SpecifyName = 'always' | 'non-default';

type ErrorMessages =
    | 'typescript_typeorm_column_name_missing'
    | 'typescript_typeorm_column_name_mismatch'
    | 'typescript_typeorm_column_name_superfluous'
    | 'typescript_typeorm_column_name_suggestion_add'
    | 'typescript_typeorm_column_name_suggestion_replace'
    | 'typescript_typeorm_column_name_suggestion_remove';

type Options = [
    {
        prefer?: Prefer;
        specifyName?: SpecifyName;
    },
];

const COLUMN_DECORATORS = [
    'Column',
    'CreateDateColumn',
    'DeleteDateColumn',
    'ObjectIdColumn',
    'PrimaryColumn',
    'PrimaryGeneratedColumn',
    'UpdateDateColumn',
    'VersionColumn',
    'ViewColumn',
    'VirtualColumn',
] as const;

function splitWords(value: string): string[] {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .trim()
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean);
}

function toSnakeCase(value: string): string {
    return splitWords(value)
        .map((word) => word.toLowerCase())
        .join('_');
}

function toLowerCamelCase(value: string): string {
    const words = splitWords(value).map((word) => word.toLowerCase());
    return words
        .map((word, index) => (index === 0 ? word : `${word[0].toUpperCase()}${word.slice(1)}`))
        .join('');
}

function getExpectedName(propertyName: string, prefer: Prefer): string {
    return prefer === 'snake_case' ? toSnakeCase(propertyName) : toLowerCamelCase(propertyName);
}

function getStaticNameProperty(
    objectArgument: TSESTree.CallExpressionArgument | undefined,
): TSESTree.Property | undefined {
    if (!objectArgument || objectArgument.type !== AST_NODE_TYPES.ObjectExpression) {
        return undefined;
    }

    return objectArgument.properties.find(
        (property): property is TSESTree.Property =>
            property.type === AST_NODE_TYPES.Property &&
            property.key.type === AST_NODE_TYPES.Identifier &&
            property.key.name === 'name',
    );
}

function getStringLiteralValue(property: TSESTree.Property | undefined): string | undefined {
    if (
        !property ||
        property.value.type !== AST_NODE_TYPES.Literal ||
        typeof property.value.value !== 'string'
    ) {
        return undefined;
    }
    return property.value.value;
}

const createRule = ESLintUtils.RuleCreator(
    (name) =>
        `https://github.com/daniel7grant/eslint-plugin-typeorm-typescript#typeorm-typescript${name}`,
);

const enforceColumnName = createRule<Options, ErrorMessages>({
    name: 'enforce-column-name',
    defaultOptions: [{ prefer: 'snake_case', specifyName: 'non-default' }],
    meta: {
        type: 'problem',
        docs: {
            description: 'TypeORM column names should follow a consistent naming convention.',
        },
        hasSuggestions: true,
        messages: {
            typescript_typeorm_column_name_missing:
                'Column name of {{ propertyName }}{{ className }} must be specified explicitly{{ expectedValue }}.',
            typescript_typeorm_column_name_mismatch:
                'Column name of {{ propertyName }}{{ className }} does not match the expected convention{{ expectedValue }}.',
            typescript_typeorm_column_name_superfluous:
                'Column name of {{ propertyName }}{{ className }} matches the default convention and can be removed.',
            typescript_typeorm_column_name_suggestion_add:
                'Add name: {{ expectedValue }} to {{ propertyName }}.',
            typescript_typeorm_column_name_suggestion_replace:
                'Change the name of {{ propertyName }} to {{ expectedValue }}.',
            typescript_typeorm_column_name_suggestion_remove:
                'Remove redundant name from {{ propertyName }}.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    prefer: {
                        type: 'string',
                        enum: ['snake_case', 'lowerCamelCase'],
                    },
                    specifyName: {
                        type: 'string',
                        enum: ['always', 'non-default'],
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    create(context, [{ prefer = 'snake_case', specifyName = 'non-default' }]) {
        return {
            PropertyDefinition(node) {
                const columnArguments = findEitherDecoratorArguments(node.decorators, [
                    ...COLUMN_DECORATORS,
                ]);
                if (!columnArguments || node.key.type !== AST_NODE_TYPES.Identifier) {
                    return;
                }

                const [, decoratorArguments] = columnArguments;
                const propertyName = node.key.name;
                const expectedName = getExpectedName(propertyName, prefer);
                const optionsArgument = findObjectArgument(decoratorArguments);
                const nameProperty = getStaticNameProperty(optionsArgument);
                const explicitName = getStringLiteralValue(nameProperty);
                const classObject = findParentClass(node);
                const className = classObject?.id ? ` in ${classObject.id.name}` : '';
                const expectedValue = ` (expected name: ${expectedName})`;

                if (!nameProperty) {
                    if (specifyName === 'always' || propertyName !== expectedName) {
                        const reportedNode =
                            optionsArgument ?? decoratorArguments[0]?.parent ?? node;
                        context.report({
                            node: reportedNode,
                            messageId: 'typescript_typeorm_column_name_missing',
                            data: {
                                className,
                                propertyName,
                                expectedValue,
                            },
                            suggest: [
                                {
                                    messageId: 'typescript_typeorm_column_name_suggestion_add',
                                    data: {
                                        propertyName,
                                        expectedValue: `'${expectedName}'`,
                                    },
                                    fix: (fixer) => {
                                        if (!decoratorArguments.length) {
                                            const decorator = node.decorators?.find(
                                                (item) =>
                                                    item.expression.type ===
                                                        AST_NODE_TYPES.CallExpression &&
                                                    item.expression.callee.type ===
                                                        AST_NODE_TYPES.Identifier &&
                                                    COLUMN_DECORATORS.includes(
                                                        item.expression.callee
                                                            .name as (typeof COLUMN_DECORATORS)[number],
                                                    ),
                                            );
                                            if (!decorator) {
                                                return null;
                                            }
                                            return fixer.insertTextAfterRange(
                                                [decorator.range[0], decorator.range[1] - 1],
                                                `{ name: '${expectedName}' }`,
                                            );
                                        }

                                        if (
                                            optionsArgument?.type ===
                                            AST_NODE_TYPES.ObjectExpression
                                        ) {
                                            if (optionsArgument.properties.length === 0) {
                                                return fixer.insertTextAfterRange(
                                                    [
                                                        optionsArgument.range[0],
                                                        optionsArgument.range[1] - 1,
                                                    ],
                                                    ` name: '${expectedName}' `,
                                                );
                                            }
                                            return fixer.insertTextAfter(
                                                optionsArgument.properties[
                                                    optionsArgument.properties.length - 1
                                                ],
                                                `, name: '${expectedName}'`,
                                            );
                                        }

                                        return fixer.insertTextAfter(
                                            decoratorArguments[decoratorArguments.length - 1],
                                            `, { name: '${expectedName}' }`,
                                        );
                                    },
                                },
                            ],
                            loc: reportedNode.loc,
                        });
                    }
                    return;
                }

                if (explicitName === undefined) {
                    return;
                }

                if (explicitName !== expectedName) {
                    context.report({
                        node: nameProperty.value,
                        messageId: 'typescript_typeorm_column_name_mismatch',
                        data: {
                            className,
                            propertyName,
                            expectedValue,
                        },
                        suggest: [
                            {
                                messageId: 'typescript_typeorm_column_name_suggestion_replace',
                                data: {
                                    propertyName,
                                    expectedValue: `'${expectedName}'`,
                                },
                                fix: (fixer) =>
                                    fixer.replaceText(nameProperty.value, `'${expectedName}'`),
                            },
                        ],
                        loc: nameProperty.loc,
                    });
                    return;
                }

                if (specifyName === 'non-default' && propertyName === expectedName) {
                    context.report({
                        node: nameProperty,
                        messageId: 'typescript_typeorm_column_name_superfluous',
                        data: {
                            className,
                            propertyName,
                        },
                        suggest: [
                            {
                                messageId: 'typescript_typeorm_column_name_suggestion_remove',
                                data: {
                                    propertyName,
                                },
                                fix: (fixer) => {
                                    if (
                                        !optionsArgument ||
                                        optionsArgument.type !== AST_NODE_TYPES.ObjectExpression
                                    ) {
                                        return null;
                                    }

                                    if (optionsArgument.properties.length === 1) {
                                        const objectIndex = decoratorArguments.findIndex(
                                            (argument) => argument === optionsArgument,
                                        );
                                        if (objectIndex > 0) {
                                            return fixer.removeRange([
                                                decoratorArguments[objectIndex - 1].range[1],
                                                optionsArgument.range[1],
                                            ]);
                                        }
                                        return fixer.remove(optionsArgument);
                                    }

                                    const propertyIndex = optionsArgument.properties.findIndex(
                                        (property) => property === nameProperty,
                                    );
                                    if (propertyIndex > 0) {
                                        return fixer.removeRange([
                                            optionsArgument.properties[propertyIndex - 1].range[1],
                                            nameProperty.range[1],
                                        ]);
                                    }
                                    return fixer.removeRange([
                                        nameProperty.range[0],
                                        optionsArgument.properties[propertyIndex + 1].range[0],
                                    ]);
                                },
                            },
                        ],
                        loc: nameProperty.loc,
                    });
                }
            },
        };
    },
});

export default enforceColumnName;
