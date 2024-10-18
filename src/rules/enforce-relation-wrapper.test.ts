import path from 'path';
import * as vitest from 'vitest';
import tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from './enforce-relation-wrapper.js';

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

ruleTester.run('enforce-relation-wrapper', rule, {
    valid: [
        {
            name: 'should "see" aliased imports',
            code: `import { OneToMany as OTM, Relation as Foreign } from 'typeorm'
                class Foo {
                    @OTM(() => Bar)
                    prop: Foreign<Bar> | undefined
                }`,
        },
        {
            name: 'should respect current code as long as all wrappings are okay',
            code: `import { OneToMany, Relation } from 'typeorm'
                class Foo {
                    @OneToMany(() => Bar)
                    prop: Relation<Bar> | Relation<Baz | undefined>
                }`,
        },
    ],
    invalid: [
        {
            name: 'should fail due to missing Relation<...>-wrapper',
            code: `import { OneToMany } from 'typeorm'
                class Foo {
                    @OneToMany(() => Bar)
                    prop: Bar | undefined
                }`,
            errors: [{ messageId: 'expectedRelation' }, { messageId: 'preferRelation' }],
            output: `import { OneToMany, Relation } from 'typeorm'
                class Foo {
                    @OneToMany(() => Bar)
                    prop: Relation<Bar> | undefined
                }`,
        },
        {
            name: 'should fail due to missing Relation<...>-wrapper with aliased decorator',
            code: `import { OneToMany as OTM } from 'typeorm'
                class Foo {
                    @OTM(() => Bar)
                    prop: Bar | undefined
                }`,
            errors: [{ messageId: 'expectedRelation' }, { messageId: 'preferRelation' }],
            output: `import { OneToMany as OTM, Relation } from 'typeorm'
                class Foo {
                    @OTM(() => Bar)
                    prop: Relation<Bar> | undefined
                }`,
        },
        {
            name: 'should fail due to missing Relation<...>-wrapper but respects wrapper alias',
            code: `import { OneToMany, Relation as Reference } from 'typeorm'
                class Foo {
                    @OneToMany(() => Bar)
                    prop: Bar | undefined
                }`,
            errors: [{ messageId: 'preferRelation' }],
            output: `import { OneToMany, Relation as Reference } from 'typeorm'
                class Foo {
                    @OneToMany(() => Bar)
                    prop: Reference<Bar> | undefined
                }`,
        },
        {
            name: 'should fail due to partially missing Relation<...>-wrapper',
            code: `import { OneToMany } from 'typeorm'
                class Foo {
                    @OneToMany(() => Bar)
                    prop: Relation<Foo> | Bar | undefined
                }`,
            errors: [{ messageId: 'expectedRelation' }, { messageId: 'preferRelation' }],
            output: `import { OneToMany, Relation } from 'typeorm'
                class Foo {
                    @OneToMany(() => Bar)
                    prop: Relation<Foo | Bar> | undefined
                }`,
        },
    ],
});
