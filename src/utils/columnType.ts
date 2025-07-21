import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import {
    ArrayTypeNode,
    LiteralTypeNode,
    SyntaxKind,
    TypeChecker,
    TypeNode,
    UnionTypeNode,
    isTypeReferenceNode,
} from 'typescript';
import { parseObjectLiteral } from './treeTraversal.js';

type Column =
    | 'Column'
    | 'PrimaryColumn'
    | 'PrimaryGeneratedColumn'
    | 'CreateDateColumn'
    | 'UpdateDateColumn'
    | 'DeleteDateColumn'
    | 'VersionColumn';

type ColumnTypeString = 'string' | 'number' | 'boolean' | 'Date' | 'unknown';

export interface ColumnType {
    columnType: ColumnTypeString;
    nullable: boolean;
    literal: boolean;
    array: boolean;
    isWeirdNumber: boolean;
}

interface ColumnParameter {
    type?: string;
    nullable?: boolean;
    transformer?: object;
    array?: boolean;
}

// From: https://github.com/typeorm/typeorm/blob/master/src/driver/types/ColumnTypes.ts
const booleanLike = ['boolean', 'bool'];
const numberLike = [
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
    'double precision',
    'double',
    'fixed',
    'float',
    'number',
    'numeric',
    'real',
    'smalldecimal',
];
// These are numbers that depend on the driver if parsed to a string (MySQL, PostgreSQL) or number (SQLite)
// @see https://typeorm.io/entities#column-types, https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/issues/5
const weirdNumberLike = ['bigint', 'dec', 'decimal'];
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
    'uuid',
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

function convertTypeOrmToColumnType(arg: string, driver?: string): ColumnTypeString {
    if (booleanLike.includes(arg)) {
        return 'boolean';
    }
    if (numberLike.includes(arg)) {
        return 'number';
    }
    if (weirdNumberLike.includes(arg)) {
        return driver === 'sqlite' ? 'number' : 'string';
    }
    if (stringLike.includes(arg)) {
        return 'string';
    }
    if (dateLike.includes(arg)) {
        return 'Date';
    }
    return 'unknown';
}

export function getDefaultColumnTypeForDecorator(column: Column): ColumnParameter {
    switch (column) {
        case 'PrimaryGeneratedColumn':
        case 'VersionColumn':
            return { type: 'integer', nullable: false };
        case 'CreateDateColumn':
        case 'UpdateDateColumn':
            return { type: 'datetime', nullable: false };
        case 'DeleteDateColumn':
            return { type: 'datetime', nullable: true };
        case 'PrimaryColumn':
        case 'Column':
        default:
            return {};
    }
}

export function convertArgumentToColumnType(
    column: Column,
    args: TSESTree.CallExpressionArgument[],
    driver?: string,
): ColumnType {
    const parsed = args.reduce((prev, arg) => {
        switch (arg.type) {
            case AST_NODE_TYPES.ObjectExpression:
                return { ...prev, ...parseObjectLiteral(arg) };
            case AST_NODE_TYPES.Literal:
                if (typeof arg.value === 'string') {
                    return { ...prev, type: arg.value };
                }
                return prev;
            default:
                return prev;
        }
    }, getDefaultColumnTypeForDecorator(column));
    return {
        columnType:
            parsed.type && !parsed.transformer
                ? convertTypeOrmToColumnType(parsed.type, driver)
                : 'unknown',
        nullable: parsed.nullable ?? false,
        literal: false,
        array: parsed.array ?? false,
        isWeirdNumber: parsed.type ? weirdNumberLike.includes(parsed.type) : false,
    };
}

export function convertTsTypeToColumnType(arg: TypeNode, checker: TypeChecker): ColumnType {
    switch (arg.kind) {
        case SyntaxKind.TemplateLiteralType:
        case SyntaxKind.StringKeyword:
            return {
                columnType: 'string',
                nullable: false,
                literal: false,
                array: false,
                isWeirdNumber: false,
            };

        case SyntaxKind.NumberKeyword:
        case SyntaxKind.BigIntKeyword:
            return {
                columnType: 'number',
                nullable: false,
                literal: false,
                array: false,
                isWeirdNumber: false,
            };

        case SyntaxKind.BooleanKeyword:
            return {
                columnType: 'boolean',
                nullable: false,
                literal: false,
                array: false,
                isWeirdNumber: false,
            };

        case SyntaxKind.TypeReference:
            if (isTypeReferenceNode(arg)) {
                const symbol = checker.getTypeAtLocation(arg.typeName).getSymbol();
                if (symbol?.getName() === 'Date') {
                    return {
                        columnType: 'Date',
                        nullable: false,
                        literal: false,
                        array: false,
                        isWeirdNumber: false,
                    };
                }
            }
            break;

        case SyntaxKind.LiteralType: {
            const literal = arg as LiteralTypeNode;
            switch (literal.literal.kind) {
                case SyntaxKind.NullKeyword:
                    return {
                        columnType: 'unknown',
                        nullable: true,
                        literal: false,
                        array: false,
                        isWeirdNumber: false,
                    };

                case SyntaxKind.StringLiteral:
                    return {
                        columnType: 'string',
                        nullable: false,
                        literal: true,
                        array: false,
                        isWeirdNumber: false,
                    };

                case SyntaxKind.NumericLiteral:
                    return {
                        columnType: 'number',
                        nullable: false,
                        literal: true,
                        array: false,
                        isWeirdNumber: false,
                    };

                case SyntaxKind.TrueKeyword:
                case SyntaxKind.FalseKeyword:
                    return {
                        columnType: 'boolean',
                        nullable: false,
                        literal: true,
                        array: false,
                        isWeirdNumber: false,
                    };

                default:
                    break;
            }
            break;
        }

        case SyntaxKind.ArrayType: {
            const array = arg as ArrayTypeNode;
            const item = convertTsTypeToColumnType(array.elementType, checker);
            return { ...item, array: true };
        }

        case SyntaxKind.UnionType: {
            const union = arg as UnionTypeNode;
            return union.types.reduce<ColumnType>(
                (acc, currentType) => {
                    const current = convertTsTypeToColumnType(currentType, checker);
                    return {
                        columnType:
                            current.columnType !== 'unknown' ? current.columnType : acc.columnType,
                        nullable: current.nullable || acc.nullable,
                        literal: current.literal || acc.literal,
                        array: current.array || acc.array,
                        isWeirdNumber: current.isWeirdNumber || acc.isWeirdNumber,
                    };
                },
                {
                    columnType: 'unknown',
                    nullable: false,
                    literal: false,
                    array: false,
                    isWeirdNumber: false,
                },
            );
        }
        default:
            return {
                columnType: 'unknown',
                nullable: false,
                literal: false,
                array: false,
                isWeirdNumber: false,
            };
    }
    return {
        columnType: 'unknown',
        nullable: false,
        literal: false,
        array: false,
        isWeirdNumber: false,
    };
}

export function convertTypeToColumnType(arg: TSESTree.TypeNode): ColumnType {
    switch (arg.type) {
        case AST_NODE_TYPES.TSStringKeyword:
            return {
                columnType: 'string',
                nullable: false,
                literal: false,
                array: false,
                isWeirdNumber: false,
            };

        case AST_NODE_TYPES.TSBigIntKeyword:
        case AST_NODE_TYPES.TSNumberKeyword:
            return {
                columnType: 'number',
                nullable: false,
                literal: false,
                array: false,
                isWeirdNumber: false,
            };

        case AST_NODE_TYPES.TSBooleanKeyword:
            return {
                columnType: 'boolean',
                nullable: false,
                literal: false,
                array: false,
                isWeirdNumber: false,
            };

        case AST_NODE_TYPES.TSNullKeyword:
            return {
                columnType: 'unknown',
                nullable: true,
                literal: false,
                array: false,
                isWeirdNumber: false,
            };

        case AST_NODE_TYPES.TSTypeReference:
            if (arg.typeName.type === AST_NODE_TYPES.Identifier && arg.typeName.name === 'Date') {
                return {
                    columnType: 'Date',
                    nullable: false,
                    literal: false,
                    array: false,
                    isWeirdNumber: false,
                };
            }
            return {
                columnType: 'unknown',
                nullable: false,
                literal: false,
                array: false,
                isWeirdNumber: false,
            };

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
                            isWeirdNumber: current.isWeirdNumber || acc.isWeirdNumber,
                        };
                    }
                    return acc;
                },
                {
                    columnType: 'unknown',
                    nullable: false,
                    literal: false,
                    array: false,
                    isWeirdNumber: false,
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
                            isWeirdNumber: false,
                        };
                    }
                    return {
                        columnType: 'unknown',
                        nullable: false,
                        literal: true,
                        array: false,
                        isWeirdNumber: false,
                    };
                }
                case AST_NODE_TYPES.TemplateLiteral:
                    return {
                        columnType: 'string',
                        nullable: false,
                        literal: true,
                        array: false,
                        isWeirdNumber: false,
                    };
                default:
                    return {
                        columnType: 'unknown',
                        nullable: false,
                        literal: true,
                        array: false,
                        isWeirdNumber: false,
                    };
            }

        case AST_NODE_TYPES.TSArrayType: {
            const item = convertTypeToColumnType(arg.elementType);
            return { ...item, array: true };
        }

        // TODO: handles these types too
        case AST_NODE_TYPES.TSObjectKeyword: // Object type
        case AST_NODE_TYPES.TSAnyKeyword: // Unknown types
        case AST_NODE_TYPES.TSUndefinedKeyword:
        case AST_NODE_TYPES.TSUnknownKeyword:
        default:
            return {
                columnType: 'unknown',
                nullable: false,
                literal: false,
                array: false,
                isWeirdNumber: false,
            };
    }
}

export function isTypesEqual(toType: ColumnType, tsType: ColumnType): boolean {
    // If either is unknown, we only check the nullability
    if (toType.columnType === 'unknown' || tsType.columnType === 'unknown') {
        return toType.nullable === tsType.nullable;
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
