import * as vitest from 'vitest';
import { RuleTester } from '@typescript-eslint/rule-tester';
import enforceColumnTypes from './enforce-column-types';

RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

const ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
});

ruleTester.run('enforce-column-types', enforceColumnTypes, {
    valid: [
        {
            name: 'should allow matching string column types',
            code: `class Entity {
                @Column({ type: 'string' })
                str: string;
            }`,
        },
        {
            name: 'should allow matching string column types',
            code: `class Entity {
                @Column({ type: 'text' })
                text: string;
            }`,
        },
        {
            name: 'should allow matching number column types',
            code: `class Entity {
                @Column({ type: 'number' })
                num: number;
            }`,
        },
        {
            name: 'should allow matching bool column types',
            code: `class Entity {
                @Column({ type: 'boolean' })
                bool: boolean;
            }`,
        },
        {
            name: 'should allow matching date column types',
            code: `class Entity {
                @Column({ type: 'timestamp' })
                date: Date;
            }`,
        },
        {
            name: 'should allow matching date string column types',
            code: `class Entity {
                @Column({ type: 'timestamp' })
                dateStr: string;
            }`,
        },
        {
            name: 'should allow matching string nullable column types',
            code: `class Entity {
                @Column({ type: 'varchar', nullable: true })
                strNullable: string | null;
            }`,
        },
        {
            name: 'should allow matching text nullable column types',
            code: `class Entity {
                @Column({ type: 'text', nullable: true })
                textNullable: string | null;
            }`,
        },
        {
            name: 'should allow matching number nullable column types',
            code: `class Entity {
                @Column({ type: 'int', nullable: true })
                numNullable: number | null;
            }`,
        },
        {
            name: 'should allow matching bool nullable column types',
            code: `class Entity {
                @Column({ type: 'bool', nullable: true })
                boolNullable: boolean | null;
            }`,
        },
        {
            name: 'should allow matching date nullable column types',
            code: `class Entity {
                @Column({ type: 'timestamp', nullable: true })
                dateNullable: Date | null;
            }`,
        },
        {
            name: 'should allow matching string literal column types',
            code: `class Entity {
                @Column({ type: 'string' })
                strLiteral: 'one' | 'two';
            }`,
        },
        {
            name: 'should allow matching string literal column types',
            code: `class Entity {
                @Column({ type: 'string' })
                strLiteral: 'one' | 'two';
            }`,
        },
        {
            name: 'should allow matching number literal column types',
            code: `class Entity {
                @Column({ type: 'number' })
                numLiteral: 1 | 2;
            }`,
        },
        {
            name: 'should allow matching number literal column types',
            code: `class Entity {
                @Column({ type: 'boolean' })
                numLiteral: true;
            }`,
        },
        {
            name: 'should allow matching array nullable column types',
            code: `class Entity {
                @Column({ type: 'string', array: true, nullable: true })
                arrayNullable: string[] | null;
            }`,
        },
        {
            name: 'should allow matching array column types',
            code: `class Entity {
                @Column({ type: 'string', array: true })
                array: string[];
            }`,
        },
        {
            name: 'should ignore unknown types',
            code: `class Entity {
                @Column({ type: 'json' })
                unknownField: unknown;
            }`,
        },
        {
            name: 'should ignore reference types',
            code: `class Entity {
                @Column({ type: 'json' })
                reference: JsonObject;
            }`,
        },
        {
            name: 'should ignore transformed types',
            code: `class Entity {
                @Column({ type: 'text', transformer: { from() {}, to() {} } })
                transformed: number;
            }`,
        },
    ],
    invalid: [
        {
            name: 'should fail on nullable TypeScript type',
            code: `class Entity {
                @Column({ type: 'string' })
                str: string | null;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @Column({ type: 'string' })
                str: string;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on nullable TypeORM type',
            code: `class Entity {
                @Column({ type: 'string', nullable: true })
                str: string;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @Column({ type: 'string', nullable: true })
                str: string | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on nullable TypeORM type',
            code: `class Entity {
                @Column({ type: 'string', nullable: true })
                str: 'one' | 'true';
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: null,
                },
            ],
        },
        {
            name: 'should fail on array TypeORM type',
            code: `class Entity {
                @Column({ type: 'string', array: true })
                str: string;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @Column({ type: 'string', array: true })
                str: string[];
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on non-array TypeORM type',
            code: `class Entity {
                @Column({ type: 'string' })
                str: string[];
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @Column({ type: 'string' })
                str: string;
            }`,
                        },
                    ],
                },
            ],
        },
    ],
});
