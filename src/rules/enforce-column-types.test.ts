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
    ],
    invalid: [
        {
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
