import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import {
    findEitherDecoratorArguments,
    findParentClass,
    parseObjectLiteral,
} from '../utils/treeTraversal';

type ErrorMessages = 'typescript_typeorm_must_nullability';
type SpecifyNullability = 'always' | 'only-nullable' | undefined;
type Options = [
    {
        specifyNullable: SpecifyNullability;
    },
];

const createRule = ESLintUtils.RuleCreator(
    (name) =>
        `https://github.com/daniel7grant/eslint-plugin-typeorm-typescript#typeorm-typescript${name}`,
);

const enforceColumnTypes = createRule<Options, ErrorMessages>({
    name: 'enforce-consistent-nullability',
    defaultOptions: [{ specifyNullable: undefined }],
    meta: {
        type: 'problem',
        docs: {
            description: 'TypeORM nullability should be consistent.',
            recommended: 'recommended',
        },
        hasSuggestions: true,
        messages: {
            typescript_typeorm_must_nullability:
                'The nullability of {{ propertyName }}{{ className }} should{{ not }} be defined{{ expectedValue }}.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    specifyNullable: {
                        type: 'string',
                        enum: ['always', 'only-nullable'],
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    create(context, [{ specifyNullable }]) {
        return {
            PropertyDefinition(node) {
                if (!specifyNullable) {
                    return;
                }

                const columnArguments = findEitherDecoratorArguments(node.decorators, [
                    'Column',
                    'PrimaryColumn',
                    'PrimaryGeneratedColumn',
                    'CreateDateColumn',
                    'UpdateDateColumn',
                    'DeleteDateColumn',
                    'VersionColumn',
                    'OneToOne',
                    'ManyToOne',
                ]);
                if (!columnArguments || !node.typeAnnotation) {
                    return;
                }

                const [column, colArguments] = columnArguments;
                const defaultNullability = column === 'OneToOne' || column === 'ManyToOne';

                const argumentNode = colArguments.find(
                    (arg): arg is TSESTree.ObjectExpression =>
                        arg.type === AST_NODE_TYPES.ObjectExpression,
                );
                const { nullable } = parseObjectLiteral(argumentNode);

                if (
                    (specifyNullable === 'always' && nullable === undefined) ||
                    (specifyNullable === 'only-nullable' && nullable === defaultNullability)
                ) {
                    // Construct strings for error message
                    const reportedNode = argumentNode ?? colArguments[0].parent;
                    const propertyName =
                        node.key?.type === AST_NODE_TYPES.Identifier ? node.key.name : 'property';
                    const classObject = findParentClass(node);
                    const className = classObject?.id ? ` in ${classObject.id.name}` : '';
                    const expectedValue =
                        specifyNullable === 'always'
                            ? ` ({ nullable:  ${defaultNullability}})`
                            : undefined;

                    // Report the error
                    context.report({
                        node: reportedNode,
                        messageId: 'typescript_typeorm_must_nullability',
                        data: {
                            className,
                            propertyName,
                            expectedValue,
                        },
                        suggest: [
                            // {
                            //     messageId: 'typescript_typeorm_must_nullability',
                            //     fix: (fixer) => {
                            //         if (argumentNode) {
                            //             if (nullable !== undefined) {
                            //                 return fixer.remove(
                            //                     argumentNode.properties.find(
                            //                         (prop) =>
                            //                             prop.type === AST_NODE_TYPES.Property &&
                            //                             prop.key.type ===
                            //                                 AST_NODE_TYPES.Identifier &&
                            //                             prop.key.name === 'nullable',
                            //                     )!,
                            //                 );
                            //             }
                            //             return fixer.insertTextAfter(
                            //                 argumentNode.properties[
                            //                     argumentNode.properties.length - 1
                            //                 ],
                            //                 `, nullable: ${defaultNullability}`,
                            //             );
                            //         }
                            //         return fixer.insertTextAfter(
                            //             colArguments[colArguments.length - 1],
                            //             `, { nullable: ${defaultNullability} }`,
                            //         );
                            //     },
                            //     data: {
                            //         className,
                            //         propertyName,
                            //         expectedValue,
                            //     },
                            // },
                        ],
                        loc: reportedNode.loc,
                    });
                }
            },
        };
    },
});

export default enforceColumnTypes;
