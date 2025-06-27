import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { findObjectArgument, findReturnedValue, parseObjectLiteral } from './treeTraversal.js';

interface RelationType {
    name: string;
    nullable: boolean;
    isArray: boolean;
    isLazy: boolean;
    isWrapped: boolean;
    isOptionalUndefined: boolean;
}

export type Relation = 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';

export function convertTypeToRelationType(arg: TSESTree.TypeNode): RelationType {
    switch (arg.type) {
        case AST_NODE_TYPES.TSTypeReference: {
            const name = arg.typeName.type === AST_NODE_TYPES.Identifier ? arg.typeName.name : '';
            const param = arg.typeArguments?.params?.[0];
            if (name === 'Promise' && param) {
                return {
                    ...convertTypeToRelationType(param),
                    isLazy: true,
                };
            }
            if (name === 'Relation' && param) {
                return {
                    ...convertTypeToRelationType(param),
                    isWrapped: true,
                };
            }
            return {
                name,
                isArray: false,
                isLazy: false,
                nullable: false,
                isWrapped: false,
                isOptionalUndefined: false,
            };
        }
        case AST_NODE_TYPES.TSArrayType: {
            const item = convertTypeToRelationType(arg.elementType);
            return { ...item, isArray: true };
        }
        case AST_NODE_TYPES.TSNullKeyword: {
            return {
                name: '',
                isArray: false,
                isLazy: false,
                nullable: true,
                isWrapped: false,
                isOptionalUndefined: false,
            };
        }
        case AST_NODE_TYPES.TSUndefinedKeyword: {
            return {
                name: '',
                isArray: false,
                isLazy: false,
                nullable: false,
                isWrapped: false,
                isOptionalUndefined: true,
            };
        }
        case AST_NODE_TYPES.TSUnionType: {
            return arg.types.reduce(
                (acc, currentNode) => {
                    const current = convertTypeToRelationType(currentNode);
                    return {
                        name: acc.name || current.name,
                        isArray: acc.isArray || current.isArray,
                        isLazy: acc.isLazy || current.isLazy,
                        isWrapped: acc.isWrapped || current.isWrapped,
                        nullable: acc.nullable || current.nullable,
                        isOptionalUndefined: acc.isOptionalUndefined || current.isOptionalUndefined,
                    };
                },
                {
                    name: '',
                    isArray: false,
                    isLazy: false,
                    nullable: false,
                    isWrapped: false,
                    isOptionalUndefined: false,
                } as RelationType,
            );
        }
        default: {
            return {
                name: '',
                isArray: false,
                isLazy: false,
                nullable: false,
                isWrapped: false,
                isOptionalUndefined: false,
            };
        }
    }
}

export function convertArgumentToRelationType(
    relation: Relation,
    args: TSESTree.CallExpressionArgument[],
): RelationType | undefined {
    const [otherEntityFn, ...restArguments] = args;
    const otherEntity = findReturnedValue(otherEntityFn);
    if (!otherEntity) {
        return undefined;
    }

    // OneToMany, ManyToMany
    if (relation === 'OneToMany' || relation === 'ManyToMany') {
        return {
            name: otherEntity,
            isArray: true,
            isLazy: false,
            isWrapped: false,
            nullable: false,
            isOptionalUndefined: false,
        };
    }
    // OneToOne, ManyToOne
    const options = findObjectArgument(restArguments);
    const parsedOptions = parseObjectLiteral(options) as { nullable?: boolean } | undefined;

    return {
        name: otherEntity,
        isArray: false,
        isLazy: false,
        isWrapped: false,
        nullable: parsedOptions?.nullable ?? true,
        isOptionalUndefined: false,
    };
}

export function isTypesEqual(toType: RelationType, tsType: RelationType): boolean {
    // Just check field equality
    return (
        toType.name === tsType.name &&
        toType.nullable === tsType.nullable &&
        toType.isArray === tsType.isArray
    );
}

// Relations are nullable by default which can be confusing, help with a custom message
export function isTypeMissingNullable(toType: RelationType, tsType: RelationType): boolean {
    // Check if the relation should be nullable but not
    return toType.name === tsType.name && toType.nullable && !tsType.nullable;
}

// Relations are nullable by default which can be confusing, help with a custom message
export function isTypeMissingArray(toType: RelationType, tsType: RelationType): boolean {
    // Check if the relation should be an array but not
    return toType.name === tsType.name && toType.isArray && !tsType.isArray;
}

export function typeToString(
    relation: RelationType,
    { isLazy, isWrapped, isOptionalUndefined }: RelationType,
): string | undefined {
    let result = relation.name;
    if (relation.isArray) {
        result += '[]';
    }
    if (relation.nullable) {
        result += ' | null';
    }
    if (isOptionalUndefined) {
        result += ' | undefined';
    }
    if (isWrapped) {
        result = `Relation<${result}>`;
    }
    if (isLazy) {
        result = `Promise<${result}>`;
    }
    return result;
}
