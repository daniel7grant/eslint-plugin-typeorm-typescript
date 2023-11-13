import { ESLintUtils } from '@typescript-eslint/utils';
import enforceRelationTypes from './enforce-relation-types';

const ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
});

ruleTester.run('enforce-relation-types', enforceRelationTypes, {
    valid: [
        {
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
            code: `class Entity {
                @OneToMany(() => Other, (other) => other.entity)
                others: Other[];
            }`,
        },
        {
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
            code: `class Entity {
                @ManyToMany(() => Other)
                @JoinTable()
                others: Other[];
            }`,
        },
    ],
    invalid: [
        {
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
