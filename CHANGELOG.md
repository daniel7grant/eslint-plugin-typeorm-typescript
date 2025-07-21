# Changelog

## [Unreleased]

## [0.5.1] - 2025-07-21

### Added 

- Add support for forcing all relations to be undefined by default ([#23](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/pull/23) by @davidenwang)

### Changed

- Allow PrimaryColumn to support any type, as opposed to defaulting to integers ([#21](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/issues/21))
- Add custom error message for bigints and decimals to make it clearer that it's not a false positive ([#22](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/issues/22))
- Update dependencies, most importantly Vite 6 to Vite 7

## [0.5.0] - 2024-12-06

### Changed

- Fix circular dependecy issue between plugin and recommended, making customization fail
    - Add `customized` example (with tests) to display the customization options
- **Breaking**: `bigint` and `decimal` are now parsed correctly according to the driver ([#5](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/issues/5#issuecomment-2452988205))
    - There is new option `driver` for `enforce-column-types`: can be 'postgres', 'mysql' or 'sqlite'
    - If the driver is empty (default) or set to MySQL and PostgreSQL, bigint and decimal are parsed to be strings
    - If the driver is set to SQLite, bigint and decimal are parsed to be numbers
    - For more information, see [#5](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/issues/5#issuecomment-2455779084)

## [0.4.1] - 2024-11-24

### Added

- Add support for [ESM Relation wrapper](https://typeorm.io/#relations-in-esm-projects) ([#16](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/pull/16), [#17](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/issues/17), thanks to @lmeysel for initial implementation)
- Add option to `enforce-relation-type` to make sure that relation wrapper is specified everywhere

### Changed

- Update dependencies to fix critical issue in `cross-spawn` and `@eslint/plugin-kit`

## [0.4.0] - 2024-08-09

### Added

- Add support for flat configuration
    - Update `typescript-eslint` packages to v8
    - Update `eslint` packages to v9
    - There is a new export `eslint-plugin-typeorm-typescript/recommended`, for simple interfacing of the flat configuration
- Add dual ES Module and CommonJS support
    - Add `tsconfig.es.json` to output ES Modules to `es/`
    - Output CommonJS format to `dist/` (needs hack to set the `module` to `commonjs` in `package.json`)
    - Add `exports` fields to `package.json` for `.` and `./recommended`
    - Add extension to every import to comply with ES specification
- Add examples to be used as simple setup and end-to-end tests

## [0.3.1] - 2024-08-06

### Changed

- Ignore array on JSON columns

## [0.3.0] - 2024-06-16

### Added

- **NEW RULE** `enforce-consistent-nullability`: enable this to make sure that nullable is consistent everywhere ([#9](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/issues/9))
    - set `specifyNullable` to `always` to make the `nullable` property required everywhere
    - set `specifyNullable` to `non-default` (default behaviour) to print errors when `nullable` is set to the default value
- Allow Column decorator to handle string parameters, multiple parameters
- Add UUID column-type to string types
- Add support for additional Column decorators:
    - Primary column decorators `PrimaryColumn`, `PrimaryGeneratedColumn` is number by default,
    - Date column decorators `CreateDateColumn`, `UpdateDateColumn` is date by default, `DeleteDateColumn` is nullable,
    - Version column decorator `VersionColumn` is number.
- Add support for [Typed Rules](https://typescript-eslint.io/getting-started/typed-linting) on Column types
    - This allows to resolve referenced types (e.g. type aliases) in TypeScript types
- Allow lazy relations with `Promise<Relation>` ([#10](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/issues/10))
- Report error when the relation doesn't have an arrow function defined

### Changed

- Fix issue when empty Column type doesn't get report nullability errors
- Upgrade packages
    - Upgrade TypeScript-ESLint from v6 to v7
    - Remove AirBNB ESLint configuration

## [0.2.6] - 2024-05-31

### Added

- Add array column field to test for array types ([#3](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/issues/3))
- Add support for Column with unset type ([#7](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/issues/7))

### Changed

- Refactor internal column types
    - Replace date with Date to match with TypeScript type ([#6](https://github.com/daniel7grant/eslint-plugin-typeorm-typescript/issues/6))
    - Replace other with unknown
    - Change undefined cases to unknown
- Refactor tests to provide better messages

## [0.2.5] - 2024-04-17

### Changed

- Ignore column check when the transformer property is set
- Test cases when unknown object or reference type
- Update dependencies

## [0.2.4] - 2024-03-02

### Changed

- Add `text` type to stringLikes

## [0.2.3] - 2024-01-20

### Changed

- Updated packages

## [0.2.2] - 2023-12-19

### Changed

- Updated packages

## [0.2.1] - 2023-12-01

### Changed

- Add MIT License

## [0.2.0] - 2023-11-14

### Changed

- Upgrade dependencies
    - Upgrade `prettier` and `eslint-plugin-prettier` to version 3, reformat files
    - Upgrade `@typescript-eslint/*` to version 6
    - Added vitest for testing

## [0.1.3] - 2023-11-13

### Fixed

- Fix problem where literal types didn't trigger the relations rule
- Fix problem where if any options where given, `nullable` was interpreted as `false`

## [0.1.2] - 2023-11-13

### Fixed

- Fix URLs in the documentation URLs

## [0.1.1] - 2023-11-13

### Added

- README documentation for both rules

## [0.1.0] - 2023-11-13

### Added

-   Initial release, with two rules
    -   [typeorm-typescript/enforce-column-types](./README.md#typeorm-typescriptenforce-column-types): Checks if the TypeORM column's data type and TypeScript type is consistent.
    -   [typeorm-typescript/enforce-relation-types](./README.md#typeorm-typescriptenforce-relation-types): Checks if the TypeORM relation's data type and TypeScript type is consistent.
