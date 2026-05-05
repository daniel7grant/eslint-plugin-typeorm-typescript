import path from 'path';
import * as vitest from 'vitest';
import tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import enforceColumnName from './enforce-column-name.js';

RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            project: './tsconfig.json',
            tsconfigRootDir: path.join(__dirname, '../../tests'),
        },
    },
});

ruleTester.run('enforce-column-name', enforceColumnName, {
    valid: [
        {
            name: 'should allow implicit name when property already matches convention',
            code: `class Entity {
                @Column()
                id: number;
            }`,
        },
        {
            name: 'should allow explicit snake_case names with always',
            code: `class Entity {
                @Column({ name: 'created_at' })
                createdAt: Date;
            }`,
            options: [{ specifyName: 'always' }],
        },
        {
            name: 'should allow implicit lower camel case when preferred',
            code: `class Entity {
                @Column()
                createdAt: Date;
            }`,
            options: [{ prefer: 'lowerCamelCase' }],
        },
        {
            name: 'should allow acronym conversion for userID in snake case',
            code: `class Entity {
                @Column({ name: 'user_id' })
                userID: string;
            }`,
            options: [{ specifyName: 'always' }],
        },
        {
            name: 'should allow create date column with explicit name',
            code: `class Entity {
                @CreateDateColumn({ name: 'created_at' })
                createdAt: Date;
            }`,
            options: [{ specifyName: 'always' }],
        },
        {
            name: 'should ignore dynamic name values',
            code: `const columnName = 'created_at';
            class Entity {
                @Column({ name: columnName })
                createdAt: Date;
            }`,
        },
    ],
    invalid: [
        {
            name: 'should require name when always is set',
            code: `class Entity {
                @Column()
                createdAt: Date;
            }`,
            options: [{ specifyName: 'always' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_column_name_missing',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_name_suggestion_add',
                            output: `class Entity {
                @Column({ name: 'created_at' })
                createdAt: Date;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should reject non-snake-case explicit name by default',
            code: `class Entity {
                @Column({ name: 'createdAt' })
                createdAt: Date;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_name_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_name_suggestion_replace',
                            output: `class Entity {
                @Column({ name: 'created_at' })
                createdAt: Date;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should reject redundant default name in non-default mode',
            code: `class Entity {
                @Column({ name: 'createdAt' })
                createdAt: Date;
            }`,
            options: [{ prefer: 'lowerCamelCase', specifyName: 'non-default' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_column_name_superfluous',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_name_suggestion_remove',
                            output: `class Entity {
                @Column()
                createdAt: Date;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should require explicit lower camel case override when property is not lower camel case',
            code: `class Entity {
                @Column()
                userID: string;
            }`,
            options: [{ prefer: 'lowerCamelCase', specifyName: 'non-default' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_column_name_missing',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_name_suggestion_add',
                            output: `class Entity {
                @Column({ name: 'userId' })
                userID: string;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should reject wrong lower camel case explicit name',
            code: `class Entity {
                @Column({ name: 'user_id' })
                userID: string;
            }`,
            options: [{ prefer: 'lowerCamelCase', specifyName: 'always' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_column_name_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_name_suggestion_replace',
                            output: `class Entity {
                @Column({ name: 'userId' })
                userID: string;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should handle acronym conversion for snake case mismatches',
            code: `class Entity {
                @PrimaryColumn({ name: 'user_i_d' })
                userID: string;
            }`,
            options: [{ specifyName: 'always' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_column_name_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_name_suggestion_replace',
                            output: `class Entity {
                @PrimaryColumn({ name: 'user_id' })
                userID: string;
            }`,
                        },
                    ],
                },
            ],
        },
    ],
});
