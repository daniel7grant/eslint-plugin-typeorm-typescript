import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { parseObjectLiteral } from './treeTraversal';

type ColumnTypeString = 'string' | 'number' | 'boolean' | 'Date' | 'unknown';

interface ColumnType {
    columnType: ColumnTypeString;
    nullable: boolean;
    literal: boolean;
    array: boolean;
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
    'text',
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
        return 'Date';
    }
    return 'unknown';
}

export function convertArgumentToColumnType(
    arg: TSESTree.CallExpressionArgument | undefined,
): ColumnType {
    const parsed = parseObjectLiteral(arg) as {
        type?: string;
        nullable?: boolean;
        transformer?: object;
        array?: boolean;
    };
    if (!parsed.type || parsed.transformer) {
        return {
            columnType: 'unknown',
            nullable: parsed.nullable ?? false,
            literal: false,
            array: parsed.array ?? false,
        };
    }
    return {
        columnType: convertTypeOrmToColumnType(parsed.type),
        nullable: parsed.nullable ?? false,
        literal: false,
        array: parsed.array ?? false,
    };
}

export function convertTypeToColumnType(arg: TSESTree.TypeNode): ColumnType {
    switch (arg.type) {
        case AST_NODE_TYPES.TSStringKeyword:
            return { columnType: 'string', nullable: false, literal: false, array: false };

        case AST_NODE_TYPES.TSBigIntKeyword:
        case AST_NODE_TYPES.TSNumberKeyword:
            return { columnType: 'number', nullable: false, literal: false, array: false };

        case AST_NODE_TYPES.TSBooleanKeyword:
            return { columnType: 'boolean', nullable: false, literal: false, array: false };

        case AST_NODE_TYPES.TSNullKeyword:
            return { columnType: 'unknown', nullable: true, literal: false, array: false };

        case AST_NODE_TYPES.TSTypeReference:
            if (arg.typeName.type === AST_NODE_TYPES.Identifier && arg.typeName.name === 'Date') {
                return { columnType: 'Date', nullable: false, literal: false, array: false };
            }
            return { columnType: 'unknown', nullable: false, literal: false, array: false };

        case AST_NODE_TYPES.TSUnionType:
            return arg.types.reduce<ColumnType>(
                (acc, currentNode) => {
                    const current = convertTypeToColumnType(currentNode);
                    if (current) {
                        return {
                            columnType:
                                current.columnType !== 'unknown'
                                    ? current.columnType
                                    : acc.columnType,
                            nullable: current.nullable || acc.nullable,
                            literal: current.literal || acc.literal,
                            array: current.array || acc.array,
                        };
                    }
                    return acc;
                },
                {
                    columnType: 'unknown',
                    nullable: false,
                    literal: false,
                    array: false,
                },
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
                            array: false,
                        };
                    }
                    return { columnType: 'unknown', nullable: false, literal: true, array: false };
                }
                case AST_NODE_TYPES.TemplateLiteral:
                    return { columnType: 'string', nullable: false, literal: true, array: false };
                default:
                    return { columnType: 'unknown', nullable: false, literal: true, array: false };
            }

        case AST_NODE_TYPES.TSArrayType: {
            const item = convertTypeToColumnType(arg.elementType);
            if (item) {
                return { ...item, array: true };
            }
            return item;
        }

        // TODO: handles these types too
        case AST_NODE_TYPES.TSObjectKeyword: // Object type
        case AST_NODE_TYPES.TSAnyKeyword: // Unknown types
        case AST_NODE_TYPES.TSUndefinedKeyword:
        case AST_NODE_TYPES.TSUnknownKeyword:
        default:
            return { columnType: 'unknown', nullable: false, literal: false, array: false };
    }
}

export function isTypesEqual(toType: ColumnType, tsType: ColumnType): boolean {
    // If either is unknown, we only check the nullability
    if (toType.columnType === 'unknown' || tsType.columnType === 'unknown') {
        return toType.nullable === tsType.nullable && toType.array === tsType.array;
    }
    // Dates can be parsed into strings too
    if (
        toType.columnType === 'Date' &&
        tsType.columnType === 'string' &&
        toType.nullable === tsType.nullable &&
        toType.array === tsType.array
    ) {
        return true;
    }
    // Otherwise just check field equality
    return (
        toType.columnType === tsType.columnType &&
        toType.nullable === tsType.nullable &&
        toType.array === tsType.array
    );
}

export function typeToString(
    column: ColumnType,
    { literal, columnType: tsColumnType }: ColumnType,
): string | undefined {
    // If column type is unknown, we fall back to the TypeScript column type
    const columnType = column.columnType !== 'unknown' ? column.columnType : tsColumnType;
    // If type is unknown or literal, we don't suggest change
    if (columnType === 'unknown' || literal) {
        return undefined;
    }
    return `${columnType}${column.array ? '[]' : ''}${column.nullable ? ' | null' : ''}`;
}
