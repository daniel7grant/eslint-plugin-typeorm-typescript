import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => name);

const relationDecorators = ['OneToOne', 'OneToMany', 'ManyToOne', 'ManyToMany'] as const;

const rule = createRule({
    name: 'enforce-relation-wrapper',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Avoid statically typed relations and prefer the Relation<...>-wrapper.',
        },
        messages: {
            preferRelation: 'Better use Relation<...>-wrapper for relation types.',
            expectedRelation:
                'When importing a relation decorator, the Relation<...>-wrapper is also expected to be imported.',
        },
        schema: [],
        fixable: 'code',
        hasSuggestions: true,
    },
    defaultOptions: [],
    create(context) {
        const alias = {
            Relation: 'Relation',
            OneToMany: 'OneToMany',
            ManyToOne: 'ManyToOne',
            OneToOne: 'OneToOne',
            ManyToMany: 'ManyToMany',
        };
        let relationAliases: string[];

        function getWrapping(
            typeNode: TSESTree.TypeNode,
            wrappedTypes: TSESTree.TypeNode[],
            unwrappedTypes: TSESTree.TypeNode[],
        ): boolean {
            let fixRequired = false;
            if (typeNode.type === TSESTree.AST_NODE_TYPES.TSUnionType)
                for (const type of typeNode.types) {
                    fixRequired = getWrapping(type, wrappedTypes, unwrappedTypes) || fixRequired;
                }
            else if (typeNode.type === TSESTree.AST_NODE_TYPES.TSTypeReference) {
                const { typeName, typeArguments } = typeNode;
                if (
                    typeName.type === TSESTree.AST_NODE_TYPES.Identifier &&
                    typeName.name === alias.Relation &&
                    typeArguments?.params.length === 1
                ) {
                    // intentionally skip "fixRequired" here as types are already wrapped
                    for (const typeArgument of typeArguments.params)
                        getWrapping(typeArgument, wrappedTypes, unwrappedTypes);
                } else {
                    wrappedTypes.push(typeNode);
                    fixRequired = true;
                }
            } else unwrappedTypes.push(typeNode);

            return fixRequired;
        }

        return {
            ImportDeclaration(node) {
                if (node.source.value !== 'typeorm') return;
                let requiresImportRelation = false,
                    relationImported = false;
                for (const specifier of node.specifiers) {
                    if (specifier.type !== TSESTree.AST_NODE_TYPES.ImportSpecifier) continue;
                    const { imported } = specifier;
                    if (relationDecorators.includes(imported.name as never)) {
                        alias[imported.name as keyof typeof alias] = specifier.local.name;
                        requiresImportRelation = true;
                    }
                    if (imported.name === 'Relation') {
                        alias.Relation = specifier.local.name;
                        relationImported = true;
                        continue;
                    }
                }
                if (requiresImportRelation && !relationImported)
                    context.report({
                        messageId: 'expectedRelation',
                        node,
                        fix(fixer) {
                            const lastSpec = node.specifiers[node.specifiers.length - 1];
                            return fixer.replaceText(
                                lastSpec,
                                context.sourceCode.getText(lastSpec) + ', Relation',
                            );
                        },
                    });
            },
            PropertyDefinition(node) {
                if (!relationAliases)
                    relationAliases = [...relationDecorators.map((_) => alias[_])];

                for (const decorator of node.decorators) {
                    if (decorator.expression.type !== TSESTree.AST_NODE_TYPES.CallExpression)
                        continue;

                    const { callee } = decorator.expression;
                    if (callee.type !== TSESTree.AST_NODE_TYPES.Identifier) continue;

                    if (relationAliases.includes(callee.name) && node.typeAnnotation) {
                        const wrappedTypes: TSESTree.TypeNode[] = [];
                        const unwrappedTypes: TSESTree.TypeNode[] = [];

                        const { typeAnnotation } = node.typeAnnotation;

                        if (!getWrapping(typeAnnotation, wrappedTypes, unwrappedTypes)) return;

                        const relation = wrappedTypes
                            .map((type) => context.sourceCode.getText(type))
                            .join(' | ');

                        const replacement = [
                            `${alias.Relation}<${relation}>`,
                            ...unwrappedTypes.map((type) => context.sourceCode.getText(type)),
                        ].join(' | ');

                        // if (type.includes('Relation<')) return;
                        context.report({
                            messageId: 'preferRelation',
                            node: typeAnnotation,
                            fix(fixer) {
                                return fixer.replaceTextRange(typeAnnotation.range, replacement);
                            },
                        });
                    }
                }
            },
        };
    },
});

export default rule;
