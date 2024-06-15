import * as vitest from 'vitest';
import { RuleTester } from '@typescript-eslint/rule-tester';
import enforceRelationTypes from './enforce-relation-types';

RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

const ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
});

ruleTester.run('enforce-relation-types', enforceRelationTypes, {
    valid: [
        {
            name: 'should allow valid one-to-one relations',
            code: `class Entity {
                @OneToOne(() => Other)
                @JoinColumn()
                other: Other | null;

                @OneToOne(() => Other, (other) => other.entity)
                @JoinColumn()
                other: Other | null;
                
                @OneToOne(() => Other, { nullable: false })
                @JoinColumn()
                other: Other;

                @OneToOne(() => Other, (other) => other.entity, { nullable: false })
                @JoinColumn()
                other: Other;
            }`,
        },
        {
            name: 'should allow valid one-to-many relations',
            code: `class Entity {
                @OneToMany(() => Other, (other) => other.entity)
                others: Other[];
            }`,
        },
        {
            name: 'should allow valid many-to-one relations',
            code: `class Entity {
                @ManyToOne(() => Other)
                other: Other | null;

                @ManyToOne(() => Other, { nullable: false })
                other: Other;
                
                @ManyToOne(() => Other, (other) => other.entity)
                other: Other | null;

                @ManyToOne(() => Other, (other) => other.entity, { nullable: false })
                other: Other;
            }`,
        },
        {
            name: 'should allow valid many-to-many relations',
            code: `class Entity {
                @ManyToMany(() => Other)
                @JoinTable()
                others: Other[];
            }`,
        },
    ],
    invalid: [
        {
            name: 'should fail on nullable one-to-one relations',
            code: `class Entity {
                @OneToOne(() => Other)
                @JoinColumn()
                other: Other;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_nullable_by_default',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @OneToOne(() => Other)
                @JoinColumn()
                other: Other | null;
            }`,
                        },
                        {
                            messageId: 'typescript_typeorm_relation_nullable_by_default_suggestion',
                            output: `class Entity {
                @OneToOne(() => Other, { nullable: false })
                @JoinColumn()
                other: Other;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on unspecified nullable one-to-one relations',
            code: `class Entity {
                @OneToOne(() => Other, {})
                @JoinColumn()
                other: Other;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_nullable_by_default',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @OneToOne(() => Other, {})
                @JoinColumn()
                other: Other | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on mismatched one-to-one relations',
            code: `class Entity {
                @OneToOne(() => Other)
                @JoinColumn()
                other: Another | null;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @OneToOne(() => Other)
                @JoinColumn()
                other: Other | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on primitive one-to-one relations',
            code: `class Entity {
                @OneToOne(() => Other)
                @JoinColumn()
                other: string;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @OneToOne(() => Other)
                @JoinColumn()
                other: Other | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on literal one-to-one relations',
            code: `class Entity {
                @OneToOne(() => Other)
                @JoinColumn()
                other: "other";
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @OneToOne(() => Other)
                @JoinColumn()
                other: Other | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on non nullable one-to-one relations',
            code: `class Entity {
                @OneToOne(() => Other, { nullable: false })
                @JoinColumn()
                other: Other | null;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @OneToOne(() => Other, { nullable: false })
                @JoinColumn()
                other: Other;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on nullable one-to-many relations',
            code: `class Entity {
                @OneToMany(() => Other, (other) => other.entity)
                others: Other;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_array_to_many',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @OneToMany(() => Other, (other) => other.entity)
                others: Other[];
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on mismatched one-to-many relations',
            code: `class Entity {
                @OneToMany(() => Other, (other) => other.entity)
                others: Another[];
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @OneToMany(() => Other, (other) => other.entity)
                others: Other[];
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on primitive one-to-many relations',
            code: `class Entity {
                @OneToMany(() => Other, (other) => other.entity)
                others: string[];
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @OneToMany(() => Other, (other) => other.entity)
                others: Other[];
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on nullable many-to-one relations',
            code: `class Entity {
                @ManyToOne(() => Other)
                other: Other;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_nullable_by_default',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @ManyToOne(() => Other)
                other: Other | null;
            }`,
                        },
                        {
                            messageId: 'typescript_typeorm_relation_nullable_by_default_suggestion',
                            output: `class Entity {
                @ManyToOne(() => Other, { nullable: false })
                other: Other;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on unspecified nullable many-to-one relations',
            code: `class Entity {
                @ManyToOne(() => Other, {})
                other: Other;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_nullable_by_default',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @ManyToOne(() => Other, {})
                other: Other | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on mismatched many-to-one relations',
            code: `class Entity {
                @ManyToOne(() => Other)
                other: Another | null;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @ManyToOne(() => Other)
                other: Other | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on primitive many-to-one relations',
            code: `class Entity {
                @ManyToOne(() => Other)
                other: string;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @ManyToOne(() => Other)
                other: Other | null;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on non-nullable many-to-one relations',
            code: `class Entity {
                @ManyToOne(() => Other, { nullable: false })
                other: Other | null;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @ManyToOne(() => Other, { nullable: false })
                other: Other;
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on nullable many-to-many relations',
            code: `class Entity {
                @ManyToMany(() => Other)
                @JoinTable()
                others: Other;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_array_to_many',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @ManyToMany(() => Other)
                @JoinTable()
                others: Other[];
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on mismatched many-to-many relations',
            code: `class Entity {
                @ManyToMany(() => Other)
                @JoinTable()
                others: Another[];
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @ManyToMany(() => Other)
                @JoinTable()
                others: Other[];
            }`,
                        },
                    ],
                },
            ],
        },
        {
            name: 'should fail on primitive many-to-many relations',
            code: `class Entity {
                @ManyToMany(() => Other)
                @JoinTable()
                others: string;
            }`,
            errors: [
                {
                    messageId: 'typescript_typeorm_relation_mismatch',
                    suggestions: [
                        {
                            messageId: 'typescript_typeorm_relation_suggestion',
                            output: `class Entity {
                @ManyToMany(() => Other)
                @JoinTable()
                others: Other[];
            }`,
                        },
                    ],
                },
            ],
        },
    ],
});
