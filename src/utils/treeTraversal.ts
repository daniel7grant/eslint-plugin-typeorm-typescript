import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

export function findDecoratorArguments(
    decorators: TSESTree.Decorator[] | undefined,
    name: string
): TSESTree.CallExpressionArgument[] | undefined {
    return decorators?.reduce((previous, decorator) => {
        if (
            decorator.expression.type === AST_NODE_TYPES.CallExpression &&
            decorator.expression.callee.type === AST_NODE_TYPES.Identifier &&
            decorator.expression.callee.name === name
        ) {
            return decorator.expression.arguments;
        }
        return previous;
    }, undefined as TSESTree.CallExpressionArgument[] | undefined);
}

export function findParentClass(
    node: TSESTree.PropertyDefinition
): TSESTree.ClassDeclaration | undefined {
    let parentClass = node.parent;
    while (parentClass) {
        if (parentClass.type === AST_NODE_TYPES.ClassDeclaration) {
            return parentClass;
        }
        parentClass = parentClass.parent;
    }
    return undefined;
}

export function findReturnedValue(node: TSESTree.Node | undefined): string | undefined {
    if (
        node?.type === AST_NODE_TYPES.ArrowFunctionExpression &&
        node.body.type === AST_NODE_TYPES.Identifier
    ) {
        return node.body.name;
    }
    return undefined;
}

export function findObjectArgument(
    args: TSESTree.CallExpressionArgument[] | undefined = []
): TSESTree.CallExpressionArgument | undefined {
    return args.find((arg) => arg.type === AST_NODE_TYPES.ObjectExpression);
}

export function parseObjectLiteral(
    objectLiteral: TSESTree.Node | undefined
): Record<string, unknown> {
    if (objectLiteral?.type === AST_NODE_TYPES.ObjectExpression) {
        return objectLiteral.properties.reduce((parsedObject, prop) => {
            if (
                prop.type === AST_NODE_TYPES.Property &&
                prop.key.type === AST_NODE_TYPES.Identifier &&
                prop.value.type === AST_NODE_TYPES.Literal
            ) {
                return { ...parsedObject, [prop.key.name]: prop.value.value };
            }
            return parsedObject;
        }, {} as Record<string, unknown>);
    }
    return {};
}
