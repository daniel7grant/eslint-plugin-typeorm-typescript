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
            name: 'should allow matching column types',
            code: `class Entity {
                @Column({ type: 'string' })
                str: string;

                @Column({ type: 'text' })
                text: string;

                @Column({ type: 'number' })
                num: number;

                @Column({ type: 'boolean' })
                bool: boolean;

                @Column({ type: 'timestamp' })
                date: Date;

                @Column({ type: 'timestamp' })
                dateStr: string;
                
                @Column({ type: 'varchar', nullable: true })
                strNullable: string | null;

                @Column({ type: 'text', nullable: true })
                textNullable: string | null;

                @Column({ type: 'int', nullable: true })
                numNullable: number | null;

                @Column({ type: 'bool', nullable: true })
                boolNullable: boolean | null;

                @Column({ type: 'timestamp', nullable: true })
                dateNullable: Date | null;

                @Column({ type: 'string' })
                strLiteral: 'one' | 'two';

                @Column({ type: 'string' })
                strLiteral: 'one' | 'two';

                @Column({ type: 'number' })
                numLiteral: 1 | 2;

                @Column({ type: 'boolean' })
                numLiteral: true;
            }`,
        },
        {
            name: 'should ignore unknown types',
            code: `class Entity {
                @Column({ type: 'json' })
                unknownField: unknown;

                @Column({ type: 'json' })
                reference: JsonObject;

                @Column({ type: 'text', transformer: { from() {}, to() {} } })
                transformed: number;
            }`
        }
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
    ],
});
