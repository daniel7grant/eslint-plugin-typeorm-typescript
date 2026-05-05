import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

export function splitWords(value: string): string[] {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .trim()
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean);
}

export function toSnakeCase(value: string): string {
    return splitWords(value)
        .map((word) => word.toLowerCase())
        .join('_');
}

export function toLowerCamelCase(value: string): string {
    const words = splitWords(value).map((word) => word.toLowerCase());
    return words
        .map((word, index) => (index === 0 ? word : `${word[0].toUpperCase()}${word.slice(1)}`))
        .join('');
}

type Prefer = 'snake_case' | 'lowerCamelCase';

export function getExpectedName(propertyName: string, prefer: Prefer): string {
    return prefer === 'snake_case' ? toSnakeCase(propertyName) : toLowerCamelCase(propertyName);
}

export function getStaticNameProperty(
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

export function getStringLiteralValue(property: TSESTree.Property | undefined): string | undefined {
    if (
        !property ||
        property.value.type !== AST_NODE_TYPES.Literal ||
        typeof property.value.value !== 'string'
    ) {
        return undefined;
    }
    return property.value.value;
}
