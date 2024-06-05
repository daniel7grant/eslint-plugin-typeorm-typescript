import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { findObjectArgument, findReturnedValue, parseObjectLiteral } from './treeTraversal';

interface RelationType {
    name: string;
    nullable: boolean;
    isArray: boolean;
}

export type Relation = 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';

export function convertTypeToRelationType(arg: TSESTree.TypeNode): RelationType {
    switch (arg.type) {
        case AST_NODE_TYPES.TSTypeReference: {
            return {
                name: arg.typeName.type === AST_NODE_TYPES.Identifier ? arg.typeName.name : '',
                isArray: false,
                nullable: false,
            };
        }
        case AST_NODE_TYPES.TSArrayType: {
            const item = convertTypeToRelationType(arg.elementType);
            return { ...item, isArray: true };
        }
        case AST_NODE_TYPES.TSNullKeyword: {
            return { name: '', isArray: false, nullable: true };
        }
        case AST_NODE_TYPES.TSUnionType: {
            return arg.types.reduce(
                (acc, currentNode) => {
                    const current = convertTypeToRelationType(currentNode);
                    return {
                        name: acc.name || current.name,
                        isArray: acc.isArray || current.isArray,
                        nullable: acc.nullable || current.nullable,
                    };
                },
                {
                    name: '',
                    isArray: false,
                    nullable: false,
                } as RelationType,
            );
        }
        default: {
            return { name: '', isArray: false, nullable: false };
        }
    }
}

export function convertArgumentToRelationType(
    relation: Relation,
    args: TSESTree.CallExpressionArgument[] | undefined,
): RelationType | undefined {
    if (!args) {
        return undefined;
    }
    const [otherEntityFn, ...restArguments] = args;
    const otherEntity = findReturnedValue(otherEntityFn);
    if (!otherEntity) {
        return undefined;
    }

    // OneToMany, ManyToMany
    if (relation === 'OneToMany' || relation === 'ManyToMany') {
        return { name: otherEntity, isArray: true, nullable: false };
    }
    // OneToOne, ManyToOne
    const options = findObjectArgument(restArguments);
    const parsedOptions = parseObjectLiteral(options) as { nullable?: boolean } | undefined;

    return { name: otherEntity, isArray: false, nullable: parsedOptions?.nullable ?? true };
}

export function isTypesEqual(
    toType: RelationType | undefined,
    tsType: RelationType | undefined,
): boolean {
    // If either is undefined, that means we are not sure of the types... ignore
    if (!toType || !tsType) {
        return true;
    }
    // Otherwise just check field equality
    return (
        toType.name === tsType.name &&
        toType.nullable === tsType.nullable &&
        toType.isArray === tsType.isArray
    );
}

// Relations are nullable by default which can be confusing, help with a custom message
export function isTypeMissingNullable(
    toType: RelationType | undefined,
    tsType: RelationType | undefined,
): boolean {
    // If either is undefined, that means we are not sure of the types... ignore
    if (!toType || !tsType) {
        return false;
    }
    // Otherwise check if the relation should be nullable but not
    return toType.name === tsType.name && toType.nullable && !tsType.nullable;
}

// Relations are nullable by default which can be confusing, help with a custom message
export function isTypeMissingArray(
    toType: RelationType | undefined,
    tsType: RelationType | undefined,
): boolean {
    // If either is undefined, that means we are not sure of the types... ignore
    if (!toType || !tsType) {
        return false;
    }
    // Otherwise check if the relation should be an array but not
    return toType.name === tsType.name && toType.isArray && !tsType.isArray;
}

export function typeToString(relation: RelationType | undefined): string | undefined {
    // If unknown, we don't suggest change
    if (!relation) {
        return undefined;
    }
    let result = relation.name;
    if (relation.isArray) {
        result += '[]';
    }
    if (relation.nullable) {
        result += ' | null';
    }
    return result;
}
