import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import {
    convertArgumentToColumnType,
    convertTypeToColumnType,
    isTypesEqual,
    typeToString,
} from '../utils/columnType';
import {
    findDecoratorArguments,
    findEitherDecoratorArguments,
    findParentClass,
} from '../utils/treeTraversal';

const createRule = ESLintUtils.RuleCreator(
    (name) =>
        `https://github.com/daniel7grant/eslint-plugin-typeorm-typescript#typeorm-typescript${name}`,
);

const enforceColumnTypes = createRule({
    name: 'enforce-column-types',
    defaultOptions: [],
    meta: {
        type: 'problem',
        docs: {
            description: 'TypeORM and TypeScript types should be the same on columns.',
            recommended: 'recommended',
        },
        hasSuggestions: true,
        messages: {
            typescript_typeorm_column_mismatch:
                'Type of {{ propertyName }}{{ className }} is not matching the TypeORM column type{{ expectedValue }}.',
            typescript_typeorm_column_suggestion:
                'Change the type of {{ propertyName }} to {{ expectedValue }}.',
        },
        schema: [],
    },
    create(context) {
        return {
            PropertyDefinition(node) {
                const columnArguments = findEitherDecoratorArguments(node.decorators, [
                    'Column',
                    'PrimaryColumn',
                    'PrimaryGeneratedColumn',
                    'CreateDateColumn',
                    'UpdateDateColumn',
                    'DeleteDateColumn',
                    'VersionColumn',
                ]);
                if (!columnArguments || !node.typeAnnotation) {
                    return;
                }

                const [column, colArguments] = columnArguments;
                const typeormType = convertArgumentToColumnType(column, colArguments);
                const { typeAnnotation } = node.typeAnnotation;
                const typescriptType = convertTypeToColumnType(typeAnnotation);

                if (!isTypesEqual(typeormType, typescriptType)) {
                    const fixReplace = typeToString(typeormType, typescriptType);

                    // Construct strings for error message
                    const propertyName =
                        node.key?.type === AST_NODE_TYPES.Identifier ? node.key.name : 'property';
                    const classObject = findParentClass(node);
                    const className = classObject?.id ? ` in ${classObject.id.name}` : '';
                    const expectedValue = fixReplace ? ` (expected type: ${fixReplace})` : '';

                    // Report the error
                    context.report({
                        node,
                        messageId: 'typescript_typeorm_column_mismatch',
                        data: {
                            className,
                            propertyName,
                            expectedValue,
                        },
                        suggest: fixReplace
                            ? [
                                  {
                                      messageId: 'typescript_typeorm_column_suggestion',
                                      fix: (fixer) => fixer.replaceText(typeAnnotation, fixReplace),
                                      data: {
                                          propertyName,
                                          expectedValue: fixReplace,
                                      },
                                  },
                              ]
                            : undefined,
                        loc: node.loc,
                    });
                }
            },
        };
    },
});

export default enforceColumnTypes;
