import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { parseObjectLiteral } from './treeTraversal';

type ColumnTypeString = 'string' | 'number' | 'boolean' | 'date' | 'other';

interface ColumnType {
    columnType: ColumnTypeString;
    nullable: boolean;
    literal: boolean;
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
    'date',
    'datetime',
    'datetime2',
    'datetimeoffset',
    'interval day to second',
    'interval year to month',
    'interval',
    'seconddate',
    'smalldatetime',
    'time with time zone',
    'time without time zone',
    'time',
    'timestamp with local time zone',
    'timestamp with local time zone',
    'timestamp with time zone',
    'timestamp without time zone',
    'timestamp',
    'timestamptz',
    'timetz',
    'year',
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

export function convertArgumentToColumnType(
    arg: TSESTree.CallExpressionArgument
): ColumnType | undefined {
    const parsed = parseObjectLiteral(arg) as { type?: string; nullable?: boolean };
    if (parsed.type) {
        return {
            columnType: convertTypeOrmToColumnType(parsed.type),
            nullable: parsed.nullable ?? false,
            literal: false,
        };
    }
    return undefined;
}

export function convertTypeToColumnType(arg: TSESTree.TypeNode): ColumnType | undefined {
    switch (arg.type) {
        case AST_NODE_TYPES.TSStringKeyword:
            return { columnType: 'string', nullable: false, literal: false };

        case AST_NODE_TYPES.TSBigIntKeyword:
        case AST_NODE_TYPES.TSNumberKeyword:
            return { columnType: 'number', nullable: false, literal: false };

        case AST_NODE_TYPES.TSBooleanKeyword:
            return { columnType: 'boolean', nullable: false, literal: false };

        case AST_NODE_TYPES.TSNullKeyword:
            return { columnType: 'other', nullable: true, literal: false };

        case AST_NODE_TYPES.TSTypeReference:
            if (arg.typeName.type === AST_NODE_TYPES.Identifier && arg.typeName.name === 'Date') {
                return { columnType: 'date', nullable: false, literal: false };
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
                            literal: current.literal || acc.literal,
                        };
                    }
                    return acc;
                },
                {
                    columnType: 'other',
                    nullable: false,
                    literal: false,
                }
            );
        case AST_NODE_TYPES.TSLiteralType: // Literal type
            switch (arg.literal.type) {
                case AST_NODE_TYPES.Literal: {
                    const literalType = typeof arg.literal.value;
                    if (['string', 'number', 'boolean'].includes(literalType)) {
                        return {
                            columnType: literalType as ColumnTypeString,
                            nullable: false,
                            literal: true,
                        };
                    }
                    return undefined;
                }
                case AST_NODE_TYPES.TemplateLiteral:
                    return { columnType: 'string', nullable: false, literal: true };
                default:
                    return undefined;
            }

        // TODO: handles these types too
        case AST_NODE_TYPES.TSObjectKeyword: // Object type
        case AST_NODE_TYPES.TSArrayType: // Array type
        case AST_NODE_TYPES.TSAnyKeyword: // Unknown types
        case AST_NODE_TYPES.TSUndefinedKeyword:
        case AST_NODE_TYPES.TSUnknownKeyword:
        default:
            return undefined;
    }
}

export function isTypesEqual(
    toType: ColumnType | undefined,
    tsType: ColumnType | undefined
): boolean {
    // If either is undefined, that means we are not sure of the types... ignore
    if (!toType || !tsType) {
        return true;
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

export function typeToString(column: ColumnType | undefined): string | undefined {
    // If unknown or literal, we don't suggest change
    if (!column || column.columnType === 'other' || column.literal) {
        return undefined;
    }
    return `${column.columnType}${column.nullable ? ' | null' : ''}`;
}
