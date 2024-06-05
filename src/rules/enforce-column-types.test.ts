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
            name: 'should allow matching string column types with string type',
            code: `class Entity {
                @Column('string')
                strString: string;
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
            name: 'should allow matching string nullable column types with string type',
            code: `class Entity {
                @Column('string', { nullable: true })
                strString: string | null;
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
            name: 'should allow unset types',
            code: `class Entity {
                @Column()
                unsetField: unknown;
            }`,
        },
        {
            name: 'should allow nullable unset types',
            code: `class Entity {
                @Column({ nullable: true })
                unsetNullable: unset | null;
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
            name: 'should allow nullable unknown types',
            code: `class Entity {
                @Column({ type: 'json', nullable: true })
                unknownNullable: unknown | null;
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
            name: 'should allow nullable reference types',
            code: `class Entity {
                @Column({ type: 'json', nullable: true })
                referenceNullable: JsonObject | null;
            }`,
        },
        {
            name: 'should ignore transformed types',
            code: `class Entity {
                @Column({ type: 'text', transformer: { from() {}, to() {} } })
                transformed: number;
            }`,
        },
        {
            name: 'should allow primary columns',
            code: `class Entity {
                @PrimaryColumn()
                id: number;
            }`,
        },
        {
            name: 'should allow generated primary columns',
            code: `class Entity {
                @PrimaryGeneratedColumn()
                idGenerated: number;
            }`,
        },
        {
            name: 'should allow uuid primary columns',
            code: `class Entity {
                @PrimaryGeneratedColumn('uuid')
                uuid: string;
            }`,
        },
        {
            name: 'should allow version columns',
            code: `class Entity {
                @VersionColumn()
                version: number;
            }`,
        },
        {
            name: 'should allow created date string columns',
            code: `class Entity {
                @CreateDateColumn()
                createdAt: string;
            }`,
        },
        {
            name: 'should allow created date date columns',
            code: `class Entity {
                @CreateDateColumn()
                createdAtDate: Date;
            }`,
        },
        {
            name: 'should allow updated date string columns',
            code: `class Entity {
                @UpdateDateColumn()
                updatedAt: string;
            }`,
        },
        {
            name: 'should allow updated date date columns',
            code: `class Entity {
                @UpdateDateColumn()
                updatedAtDate: Date;
            }`,
        },
        {
            name: 'should allow deleted date string columns',
            code: `class Entity {
                @DeleteDateColumn()
                deletedAt: string | null;
            }`,
        },
        {
            name: 'should allow deleted date date columns',
            code: `class Entity {
                @DeleteDateColumn()
                deletedAtDate: Date | null;
            }`,
        },
    ],
    invalid: [
        {
            name: 'should fail on non-number TypeScript type',
            code: `class Entity {
                @Column({ type: 'integer' })
                num: string;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @Column({ type: 'integer' })
                num: number;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on non-number TypeScript type with string type',
            code: `class Entity {
                @Column('integer')
                numString: string;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @Column('integer')
                numString: number;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on non-string TypeScript type',
            code: `class Entity {
                @Column({ type: 'string' })
                str: number;
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
            name: 'should fail on non-date TypeScript type',
            code: `class Entity {
                @Column({ type: 'date' })
                date: number;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @Column({ type: 'date' })
                date: Date;
            }`,
                        },
                    ],
                },
            ],
        },
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
            name: 'should fail on nullable TypeORM type with string type',
            code: `class Entity {
                @Column('string', { nullable: true })
                strString: string;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @Column('string', { nullable: true })
                strString: string | null;
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
        {
            name: 'should fail on unknown TypeORM type',
            code: `class Entity {
                @Column({ nullable: true })
                something: string;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @Column({ nullable: true })
                something: string | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on non-nullable empty TypeORM type',
            code: `class Entity {
                @Column()
                empty: string | null;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @Column()
                empty: string;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on non-number id type',
            code: `class Entity {
                @PrimaryGeneratedColumn()
                id: string;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @PrimaryGeneratedColumn()
                id: number;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on non-string uuid type',
            code: `class Entity {
                @PrimaryGeneratedColumn('uuid')
                id: number;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @PrimaryGeneratedColumn('uuid')
                id: string;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on nullable id type',
            code: `class Entity {
                @PrimaryGeneratedColumn()
                id: number | null;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @PrimaryGeneratedColumn()
                id: number;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on nullable create date type',
            code: `class Entity {
                @CreateDateColumn()
                createdAt: Date | null;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @CreateDateColumn()
                createdAt: Date;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on nullable update date type',
            code: `class Entity {
                @UpdateDateColumn()
                updatedAt: Date | null;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @UpdateDateColumn()
                updatedAt: Date;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on non-nullable delete date type',
            code: `class Entity {
                @DeleteDateColumn()
                deletedAt: Date;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_column_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_column_suggestion',
                            output: `class Entity {
                @DeleteDateColumn()
                deletedAt: Date | null;
            }`,
                        },
                    ],
                },
            ],
        },
    ],
});
