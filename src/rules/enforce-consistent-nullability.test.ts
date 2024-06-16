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
            name: 'should pass if the nullability is undefined',
            code: `class Entity {
                @Column({ type: 'string' })
                str: string;

                @Column({ type: 'string', nullable: true })
                str: string | null;
            }`,
            options: [{ specifyNullable: undefined }],
        },
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
            name: 'should check column nullable if the nullability is only-nullable',
            code: `class Entity {
                @Column({ type: 'string' })
                str: string;

                @Column({ type: 'string', nullable: true })
                str: string | null;
            }`,
            options: [{ specifyNullable: 'only-nullable' }],
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
            name: 'should check relation nullable if the nullability is only-nullable',
            code: `class Entity {
                @ManyToOne(() => Other, { nullable: false })
                other: Other;

                @ManyToOne(() => Other)
                other: Other | null;
            }`,
            options: [{ specifyNullable: 'only-nullable' }],
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
                    messageId: 'typescript_typeorm_must_nullability',
                    //         suggestions: [
                    //             {
                    //                 messageId: 'typescript_typeorm_must_nullability',
                    //                 output: `class Entity {
                    //     @Column({ type: 'string', nullable: false })
                    //     str: string;

                    //     @Column({ type: 'string', nullable: true })
                    //     str: string | null;
                    // }`,
                    //             },
                    //         ],
                },
            ],
        },
        {
            name: 'should fail given column nullable if the nullability is only-nullable',
            code: `class Entity {
                @Column({ type: 'string', nullable: false })
                str: string;

                @Column({ type: 'string', nullable: true })
                str: string | null;
            }`,
            options: [{ specifyNullable: 'only-nullable' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_must_nullability',
                    //         suggestions: [
                    //             {
                    //                 messageId: 'typescript_typeorm_must_nullability',
                    //                 output: `class Entity {
                    //     @Column({ type: 'string' })
                    //     str: string;

                    //     @Column({ type: 'string', nullable: true })
                    //     str: string | null;
                    // }`,
                    //             },
                    //         ],
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
                    messageId: 'typescript_typeorm_must_nullability',
                    //         suggestions: [
                    //             {
                    //                 messageId: 'typescript_typeorm_must_nullability',
                    //                 output: `class Entity {
                    //     @ManyToOne(() => Other, { nullable: false })
                    //     other: Other;

                    //     @ManyToOne(() => Other, { nullable: true })
                    //     other: Other | null;
                    // }`,
                    //             },
                    //         ],
                },
            ],
        },
        {
            name: 'should fail given relation nullable if the nullability is only-nullable',
            code: `class Entity {
                @ManyToOne(() => Other, { nullable: false })
                other: Other;

                @ManyToOne(() => Other, { nullable: true })
                other: Other | null;
            }`,
            options: [{ specifyNullable: 'only-nullable' }],
            errors: [
                {
                    messageId: 'typescript_typeorm_must_nullability',
                    //         suggestions: [
                    //             {
                    //                 messageId: 'typescript_typeorm_must_nullability',
                    //                 output: `class Entity {
                    //     @ManyToOne(() => Other, { nullable: false })
                    //     other: Other;

                    //     @ManyToOne(() => Other)
                    //     other: Other | null;
                    // }`,
                    //             },
                    //         ],
                },
            ],
        },
    ],
});
