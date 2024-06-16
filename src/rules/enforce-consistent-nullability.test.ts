import * as vitest from 'vitest';
import { RuleTester } from '@typescript-eslint/rule-tester';
import enforceConsistentNullability from './enforce-consistent-nullability';

RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

const ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
});

ruleTester.run('enforce-consistent-nullability', enforceConsistentNullability, {
    valid: [
        {
            name: 'should check column nullable if the nullability is always',
            code: `class Entity {
                @Column({ type: 'string', nullable: false })
                str: string;

                @Column({ type: 'string', nullable: true })
                str: string | null;
            }`,
            options: [{ specifyNullable: 'always' }],
        },
        {
            name: 'should check column nullable if the nullability is non-default',
            code: `class Entity {
                @Column({ type: 'string' })
                str: string;

                @Column({ type: 'string', nullable: true })
                str: string | null;
            }`,
            options: [{ specifyNullable: 'non-default' }],
        },
        {
            name: 'should check relation nullable if the nullability is always',
            code: `class Entity {
                @ManyToOne(() => Other, { nullable: false })
                other: Other;

                @ManyToOne(() => Other, { nullable: true })
                other: Other | null;
            }`,
            options: [{ specifyNullable: 'always' }],
        },
        {
            name: 'should check relation nullable if the nullability is non-default',
            code: `class Entity {
                @ManyToOne(() => Other, { nullable: false })
                other: Other;

                @ManyToOne(() => Other)
                other: Other | null;
            }`,
            options: [{ specifyNullable: 'non-default' }],
        },
    ],
    invalid: [
        {
            name: 'should fail undefined column nullable if the nullability is always',
            code: `class Entity {
                @Column({ type: 'string' })
                str: string;

                @Column({ type: 'string', nullable: true })
                str: string | null;
            }`,
            options: [{ specifyNullable: 'always' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_missing_nullability',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_set_nullable',
                            output: `class Entity {
                @Column({ type: 'string', nullable: false })
                str: string;

                @Column({ type: 'string', nullable: true })
                str: string | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail undefined string nullable if the nullability is always',
            code: `class Entity {
                @Column('string', {})
                str: string;

                @Column('string', { nullable: true })
                str: string | null;
            }`,
            options: [{ specifyNullable: 'always' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_missing_nullability',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_set_nullable',
                            output: `class Entity {
                @Column('string', { nullable: false })
                str: string;

                @Column('string', { nullable: true })
                str: string | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail undefined unset nullable if the nullability is always',
            code: `class Entity {
                @Column()
                str: string;

                @Column({ nullable: true })
                str: string | null;
            }`,
            options: [{ specifyNullable: 'always' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_missing_nullability',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_set_nullable',
                            output: `class Entity {
                @Column({ nullable: false })
                str: string;

                @Column({ nullable: true })
                str: string | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail given column nullable if the nullability is non-default',
            code: `class Entity {
                @Column({ type: 'string', nullable: false })
                str: string;

                @Column({ type: 'string', nullable: true })
                str: string | null;
            }`,
            options: [{ specifyNullable: 'non-default' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_superfluous_nullability',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_remove_nullable',
                            output: `class Entity {
                @Column({ type: 'string' })
                str: string;

                @Column({ type: 'string', nullable: true })
                str: string | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail given unordered column nullable if the nullability is non-default',
            code: `class Entity {
                @Column({ nullable: false, type: 'string' })
                str: string;

                @Column({ nullable: true, type: 'string' })
                str: string | null;
            }`,
            options: [{ specifyNullable: 'non-default' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_superfluous_nullability',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_remove_nullable',
                            output: `class Entity {
                @Column({ type: 'string' })
                str: string;

                @Column({ nullable: true, type: 'string' })
                str: string | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail given string column nullable if the nullability is non-default',
            code: `class Entity {
                @Column('string', { nullable: false })
                str: string;

                @Column('string', { nullable: true })
                str: string | null;
            }`,
            options: [{ specifyNullable: 'non-default' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_superfluous_nullability',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_remove_nullable',
                            output: `class Entity {
                @Column('string')
                str: string;

                @Column('string', { nullable: true })
                str: string | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail given unknown column nullable if the nullability is non-default',
            code: `class Entity {
                @Column({ nullable: false })
                str: string;

                @Column({ nullable: true })
                str: string | null;
            }`,
            options: [{ specifyNullable: 'non-default' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_superfluous_nullability',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_remove_nullable',
                            output: `class Entity {
                @Column()
                str: string;

                @Column({ nullable: true })
                str: string | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail undefined relation nullable if the nullability is always',
            code: `class Entity {
                @ManyToOne(() => Other, { nullable: false })
                other: Other;

                @ManyToOne(() => Other)
                other: Other | null;
            }`,
            options: [{ specifyNullable: 'always' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_missing_nullability',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_set_nullable',
                            output: `class Entity {
                @ManyToOne(() => Other, { nullable: false })
                other: Other;

                @ManyToOne(() => Other, { nullable: true })
                other: Other | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail given relation nullable if the nullability is non-default',
            code: `class Entity {
                @ManyToOne(() => Other, { nullable: false })
                other: Other;

                @ManyToOne(() => Other, { nullable: true })
                other: Other | null;
            }`,
            options: [{ specifyNullable: 'non-default' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_superfluous_nullability',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_remove_nullable',
                            output: `class Entity {
                @ManyToOne(() => Other, { nullable: false })
                other: Other;

                @ManyToOne(() => Other)
                other: Other | null;
            }`,
                        },
                    ],
                },
            ],
        },
    ],
});
