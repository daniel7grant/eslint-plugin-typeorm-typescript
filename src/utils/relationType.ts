import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { findReturnedValue, parseObjectLiteral } from './treeTraversal';

interface RelationType {
    name: string;
    nullable: boolean;
    isArray: boolean;
}

export const relationTypes = ['OneToOne', 'OneToMany', 'ManyToOne', 'ManyToMany'] as const;
export type Relation = (typeof relationTypes)[number];

export function convertTypeToRelationType(arg: TSESTree.TypeNode): RelationType | undefined {
    switch (arg.type) {
        case AST_NODE_TYPES.TSTypeReference: {
            if (arg.typeName.type === AST_NODE_TYPES.Identifier) {
                return { name: arg.typeName.name, isArray: false, nullable: false };
            }
            return undefined;
        }
        case AST_NODE_TYPES.TSArrayType: {
            if (
                arg.elementType.type === AST_NODE_TYPES.TSTypeReference &&
                arg.elementType.typeName.type === AST_NODE_TYPES.Identifier
            ) {
                return { name: arg.elementType.typeName.name, isArray: true, nullable: false };
            }
            return undefined;
        }
        case AST_NODE_TYPES.TSNullKeyword: {
            return { name: '', isArray: false, nullable: true };
        }
        case AST_NODE_TYPES.TSUnionType: {
            return arg.types.reduce(
                (acc, currentNode, i) => {
                    const current = convertTypeToRelationType(currentNode);
                    if (current) {
                        return {
                            name: acc.name || current.name,
                            isArray: acc.isArray || current.isArray,
                            nullable: acc.nullable || current.nullable,
                        };
                    }
                    return acc;
                },
                {
                    name: '',
                    isArray: false,
                    nullable: false,
                } as RelationType
            );
        }
    }
    return undefined;
}

export function convertArgumentToRelationType(
    relation: Relation,
    args: TSESTree.CallExpressionArgument[] | undefined
): RelationType | undefined {
    if (!args) {
        return undefined;
    }
    const [otherEntityFn, ...restArguments] = args;
    const otherEntity = findReturnedValue(otherEntityFn);
    if (!otherEntity) {
        return undefined;
    }
    if (relation === 'OneToMany' || relation === 'ManyToMany') {
        return { name: otherEntity, isArray: true, nullable: false };
    } else {
        const options = restArguments.find((arg) => arg.type === AST_NODE_TYPES.ObjectExpression);
        const { nullable } = options
            ? (parseObjectLiteral(options) as { nullable: boolean })
            : { nullable: true };

        return { name: otherEntity, isArray: false, nullable };
    }
}

export function isTypesEqual(
    toType: RelationType | undefined,
    tsType: RelationType | undefined
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

export function typeToString(relation: RelationType | undefined): string | undefined {
    // If unknown, we don't suggest change
    if (!relation) {
        return undefined;
    }
    return `${relation.name}${relation.nullable ? ' | null' : relation.isArray ? '[]' : ''}`;
}
