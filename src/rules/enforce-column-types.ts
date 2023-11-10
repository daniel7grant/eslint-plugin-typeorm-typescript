import { ESLintUtils, AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

type ColumnTypeString = 'string' | 'number' | 'boolean' | 'date' | 'other';

interface ColumnType {
    columnType: ColumnTypeString;
    nullable: boolean;
}

// From: https://github.com/typeorm/typeorm/blob/master/src/driver/types/ColumnTypes.ts
const booleanLike = ['boolean', 'bool'];
const numberLike = [
    'bigint',
    'dec',
    'decimal',
    'fixed',
    'int',
    'int2',
    'int4',
    'int8',
    'integer',
    'mediumint',
    'number',
    'numeric',
    'smalldecimal',
    'smallint',
    'tinyint',
    'dec',
    'decimal',
    'double precision',
    'double',
    'fixed',
    'float',
    'number',
    'numeric',
    'real',
    'smalldecimal',
];
const stringLike = [
    'character varying',
    'varying character',
    'char varying',
    'nvarchar',
    'national varchar',
    'character',
    'native character',
    'varchar',
    'char',
    'nchar',
    'national char',
    'varchar2',
    'nvarchar2',
    'alphanum',
    'shorttext',
    'string',
];
const dateLike = [
    'datetime',
    'datetime2',
    'datetimeoffset',
    'time',
    'time with time zone',
    'time without time zone',
    'timestamp',
    'timestamp without time zone',
    'timestamp with time zone',
    'timestamp with local time zone',
];

function convertTypeOrmToColumnType(arg: string): ColumnTypeString {
    if (booleanLike.includes(arg)) {
        return 'boolean';
    }
    if (numberLike.includes(arg)) {
        return 'number';
    }
    if (stringLike.includes(arg)) {
        return 'string';
    }
    if (dateLike.includes(arg)) {
        return 'date';
    }
    return 'other';
}

function convertArgumentToColumnType(arg: TSESTree.CallExpressionArgument): ColumnType | undefined {
    let columnType: ColumnTypeString | undefined;
    let nullable = false;
    if (arg.type === AST_NODE_TYPES.ObjectExpression) {
        for (const prop of arg.properties) {
            if (
                prop.type === AST_NODE_TYPES.Property &&
                prop.key.type === AST_NODE_TYPES.Identifier &&
                prop.value.type === AST_NODE_TYPES.Literal
            ) {
                switch (prop.key.name) {
                    case 'type':
                        columnType = convertTypeOrmToColumnType(prop.value.value as string);
                        break;
                    case 'nullable':
                        nullable = prop.value.value as boolean;
                        break;
                }
            }
        }
    }
    if (columnType) {
        return {
            columnType,
            nullable,
        };
    }
    return undefined;
}

function convertTypeToColumnType(arg: TSESTree.TypeNode): ColumnType | undefined {
    switch (arg.type) {
        case AST_NODE_TYPES.TSStringKeyword:
            return { columnType: 'string', nullable: false };

        case AST_NODE_TYPES.TSBigIntKeyword:
        case AST_NODE_TYPES.TSNumberKeyword:
            return { columnType: 'number', nullable: false };

        case AST_NODE_TYPES.TSBooleanKeyword:
            return { columnType: 'boolean', nullable: false };

        case AST_NODE_TYPES.TSNullKeyword:
            return { columnType: 'other', nullable: true };

        case AST_NODE_TYPES.TSTypeReference:
            if (arg.typeName.type === AST_NODE_TYPES.Identifier && arg.typeName.name === 'Date') {
                return { columnType: 'date', nullable: false };
            }
            return undefined;

        case AST_NODE_TYPES.TSUnionType:
            return arg.types.reduce<ColumnType>(
                (acc, currentNode) => {
                    const current = convertTypeToColumnType(currentNode);
                    if (current) {
                        return {
                            columnType:
                                current.columnType !== 'other'
                                    ? current.columnType
                                    : acc.columnType,
                            nullable: current.nullable || acc.nullable,
                        };
                    }
                    return acc;
                },
                {
                    columnType: 'other',
                    nullable: false,
                }
            );

        case AST_NODE_TYPES.TSLiteralType:
        case AST_NODE_TYPES.TSTypeLiteral:

        // TODO: handles these types too
        // Object type
        case AST_NODE_TYPES.TSObjectKeyword:
        // Array type
        case AST_NODE_TYPES.TSArrayType:
        // Unknown types
        case AST_NODE_TYPES.TSAnyKeyword:
        case AST_NODE_TYPES.TSUndefinedKeyword:
        case AST_NODE_TYPES.TSUnknownKeyword:
        default:
            return undefined;
    }
}

function isTypesEqual(toType: ColumnType | undefined, tsType: ColumnType | undefined): boolean {
    // If either is undefined, we have a problem
    if (!toType || !tsType) {
        return false;
    }
    // Dates can be parsed into strings too
    if (
        toType.columnType === 'date' &&
        tsType.columnType === 'string' &&
        toType.nullable === tsType.nullable
    ) {
        return true;
    }
    // Otherwise just check field equality
    return toType.columnType === tsType.columnType && toType.nullable === tsType.nullable;
}

function typeToString(column: ColumnType | undefined): string | undefined {
    if (!column || column.columnType === 'other') {
        return undefined;
    }
    return `${column.columnType}${column.nullable ? ' | null' : ''}`;
}

const createRule = ESLintUtils.RuleCreator((name) => name);

export const enforceColumnTypes = createRule({
    name: 'enforce-column-types',
    defaultOptions: [],
    meta: {
        type: 'problem',
        docs: {
            description: 'TypeORM and TypeScript types should be the same on columns.',
            recommended: 'error',
        },
        fixable: 'code',
        messages: {
            typescript_typeorm_mismatch:
                'This TypeScript type is not matching the TypeORM column name.',
        },
        schema: [],
    },
    create(context) {
        return {
            PropertyDefinition(node) {
                if (node.decorators) {
                    for (const decorator of node.decorators) {
                        if (
                            decorator.expression.type === AST_NODE_TYPES.CallExpression &&
                            decorator.expression.callee.type === AST_NODE_TYPES.Identifier &&
                            decorator.expression.callee.name === 'Column' &&
                            decorator.expression.arguments.length === 1
                        ) {
                            if (node.typeAnnotation !== undefined) {
                                const typeormType = convertArgumentToColumnType(
                                    decorator.expression.arguments[0]
                                );

                                const typeAnnotation = node.typeAnnotation.typeAnnotation;
                                const typescriptType = convertTypeToColumnType(typeAnnotation);

                                if (!isTypesEqual(typeormType, typescriptType)) {
                                    const fixReplace = typeToString(typeormType);

                                    context.report({
                                        node,
                                        messageId: 'typescript_typeorm_mismatch',
                                        fix: fixReplace
                                            ? (fixer) =>
                                                  fixer.replaceText(typeAnnotation, fixReplace)
                                            : undefined,
                                    });
                                }
                            }
                        }
                    }
                }
            },
        };
    },
});
