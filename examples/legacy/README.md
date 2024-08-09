# Legacy configuration

This is the legacy configuration to be used with ESLint <= 8.

## Usage

Install the package for the plugin:

```sh
npm install -D eslint-plugin-typeorm-typescript
```

Add the plugins and rules to your `.eslintrc.json` or equivalent:

```json
{
  "plugins": ["typeorm-typescript"],
  "rules": {
    "typeorm-typescript/enforce-column-types": "error",
    "typeorm-typescript/enforce-relation-types": "error",
    "typeorm-typescript/enforce-consistent-nullability": "error"
  }
}
```
