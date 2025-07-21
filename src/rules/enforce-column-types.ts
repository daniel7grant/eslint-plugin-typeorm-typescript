import { NodeBuilderFlags, TypeChecker } from 'typescript';
import {
    AST_NODE_TYPES,
    ESLintUtils,
    ParserServicesWithTypeInformation,
} from '@typescript-eslint/utils';
import {
    ColumnType,
    convertArgumentToColumnType,
    convertTsTypeToColumnType,
    convertTypeToColumnType,
    isTypesEqual,
    typeToString,
} from '../utils/columnType.js';
import { findEitherDecoratorArguments, findParentClass } from '../utils/treeTraversal.js';

const createRule = ESLintUtils.RuleCreator(
    (name) =>
        `https://github.com/daniel7grant/eslint-plugin-typeorm-typescript#typeorm-typescript${name}`,
);

type EnforceColumnMessages =
    | 'typescript_typeorm_column_mismatch'
    | 'typescript_typeorm_column_mismatch_weird'
    | 'typescript_typeorm_column_mismatch_weird_sqlite'
    | 'typescript_typeorm_column_suggestion';

type EnforceColumnOptions = [
    {
        driver?: 'postgres' | 'mysql' | 'sqlite';
    },
];

const enforceColumnTypes = createRule<EnforceColumnOptions, EnforceColumnMessages>({
    name: 'enforce-column-types',
    defaultOptions: [{}],
    meta: {
        type: 'problem',
        docs: {
            description: 'TypeORM and TypeScript types should be the same on columns.',
        },
        hasSuggestions: true,
        messages: {
            typescript_typeorm_column_mismatch:
                'Type of {{ propertyName }}{{ className }} is not matching the TypeORM column type{{ expectedValue }}.',
            typescript_typeorm_column_mismatch_weird:
                'Type of {{ propertyName }}{{ className }} should be string, because decimals and bigints might be too big for numbers, so they are encoded as strings by PostgreSQL and MySQL drivers. If you are using SQLite, change the driver option to sqlite.',
            typescript_typeorm_column_mismatch_weird_sqlite:
                'Type of {{ propertyName }}{{ className }} should be number, as decimals and bigints are encoded as numbers by SQLite. If you are not using SQLite, remove the driver option.',
            typescript_typeorm_column_suggestion:
                'Change the type of {{ propertyName }} to {{ expectedValue }}.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    driver: {
                        type: 'string',
                        enum: ['postgres', 'mysql', 'sqlite'],
                    },
                },
                additionalProperties: false,
            },
        ],
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
                const typeormType = convertArgumentToColumnType(
                    column,
                    colArguments,
                    context.options?.[0]?.driver,
                );

                const { typeAnnotation } = node.typeAnnotation;
                let typescriptType: ColumnType;
                let services: ParserServicesWithTypeInformation | undefined;
                let checker: TypeChecker | undefined;
                try {
                    services = ESLintUtils.getParserServices(context);
                    checker = services.program.getTypeChecker();
                } catch {
                    // No typechecker found, continue with typeless
                }

                if (services && checker) {
                    const type = services.getTypeAtLocation(node);
                    const typeNode = checker.typeToTypeNode(type, undefined, NodeBuilderFlags.None);

                    if (typeNode) {
                        typescriptType = convertTsTypeToColumnType(typeNode, checker);
                    } else {
                        typescriptType = convertTypeToColumnType(typeAnnotation);
                    }
                } else {
                    typescriptType = convertTypeToColumnType(typeAnnotation);
                }

                if (!isTypesEqual(typeormType, typescriptType)) {
                    const fixReplace = typeToString(typeormType, typescriptType);

                    // Construct strings for error message
                    let messageId: EnforceColumnMessages = 'typescript_typeorm_column_mismatch';
                    const propertyName =
                        node.key?.type === AST_NODE_TYPES.Identifier ? node.key.name : 'property';
                    const classObject = findParentClass(node);
                    const className = classObject?.id ? ` in ${classObject.id.name}` : '';
                    const expectedValue = fixReplace ? ` (expected type: ${fixReplace})` : '';

                    if (typeormType.isWeirdNumber) {
                        messageId =
                            context.options?.[0]?.driver === 'sqlite'
                                ? 'typescript_typeorm_column_mismatch_weird_sqlite'
                                : 'typescript_typeorm_column_mismatch_weird';
                    }

                    // Report the error
                    context.report({
                        node,
                        messageId,
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
