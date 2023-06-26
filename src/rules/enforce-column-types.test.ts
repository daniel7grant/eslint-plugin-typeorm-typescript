import { ESLintUtils } from '@typescript-eslint/utils';
import { enforceColumnTypes } from './enforce-column-types';

const ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
});

ruleTester.run('enforce-column-types', enforceColumnTypes, {
    valid: [
        {
            code: `class Entity {
                @Column({ type: 'string' })
                str: string;

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

                @Column({ type: 'int', nullable: true })
                numNullable: number | null;

                @Column({ type: 'bool', nullable: true })
                boolNullable: boolean | null;

                @Column({ type: 'timestamp', nullable: true })
                dateNullable: Date | null;
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
                    messageId: 'typescript_typeorm_mismatch',
                },
            ],
            output: `class Entity {
                @Column({ type: 'string' })
                str: string;
            }`,
        },
        {
            code: `class Entity {
                @Column({ type: 'string', nullable: true })
                str: string;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_mismatch',
                },
            ],
            output: `class Entity {
                @Column({ type: 'string', nullable: true })
                str: string | null;
            }`
        },
    ],
});
