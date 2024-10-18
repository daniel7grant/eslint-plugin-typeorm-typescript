import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { findObjectArgument, findReturnedValue, parseObjectLiteral } from './treeTraversal.js';

interface RelationType {
    name: string;
    nullable: boolean;
    isArray: boolean;
    isLazy: boolean;
}

export type Relation = 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';

export function convertTypeToRelationType(
    arg: TSESTree.TypeNode,
    relationWrapperName?: string,
): RelationType {
    switch (arg.type) {
        case AST_NODE_TYPES.TSTypeReference: {
            const name = arg.typeName.type === AST_NODE_TYPES.Identifier ? arg.typeName.name : '';
            const param = arg.typeArguments?.params?.[0];
            if (name === 'Promise' && param) {
                return {
                    ...convertTypeToRelationType(param, relationWrapperName),
                    isLazy: true,
                };
            }
            if (name === relationWrapperName && param) {
                return convertTypeToRelationType(param, relationWrapperName);
            }
            return {
                name,
                isArray: false,
                isLazy: false,
                nullable: false,
            };
        }
        case AST_NODE_TYPES.TSArrayType: {
            const item = convertTypeToRelationType(arg.elementType, relationWrapperName);
            return { ...item, isArray: true };
        }
        case AST_NODE_TYPES.TSNullKeyword: {
            return { name: '', isArray: false, isLazy: false, nullable: true };
        }
        case AST_NODE_TYPES.TSUnionType: {
            return arg.types.reduce(
                (acc, currentNode) => {
                    const current = convertTypeToRelationType(currentNode, relationWrapperName);
                    return {
                        name: acc.name || current.name,
                        isArray: acc.isArray || current.isArray,
                        isLazy: acc.isLazy || current.isLazy,
                        nullable: acc.nullable || current.nullable,
                    };
                },
                {
                    name: '',
                    isArray: false,
                    isLazy: false,
                    nullable: false,
                } as RelationType,
            );
        }
        default: {
            return { name: '', isArray: false, isLazy: false, nullable: false };
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
        return { name: otherEntity, isArray: true, isLazy: false, nullable: false };
    }
    // OneToOne, ManyToOne
    const options = findObjectArgument(restArguments);
    const parsedOptions = parseObjectLiteral(options) as { nullable?: boolean } | undefined;

    return {
        name: otherEntity,
        isArray: false,
        isLazy: false,
        nullable: parsedOptions?.nullable ?? true,
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

export function typeToString(relation: RelationType, { isLazy }: RelationType): string | undefined {
    let result = relation.name;
    if (relation.isArray) {
        result += '[]';
    }
    if (relation.nullable) {
        result += ' | null';
    }
    if (isLazy) {
        result = `Promise<${result}>`;
    }
    return result;
}
