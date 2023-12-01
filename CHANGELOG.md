# Changelog

## [Unreleased]

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
