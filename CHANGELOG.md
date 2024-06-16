# Changelog

## [Unreleased]

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
