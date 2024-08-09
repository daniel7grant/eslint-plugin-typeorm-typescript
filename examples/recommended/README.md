# Flat configuration

This is the new way to configure ESLint ("flat configuration"). Supported from ESLint >= 9.

## Usage

Install the package for the plugin:

```sh
npm install -D eslint-plugin-typeorm-typescript
```

Add the recommended configuration to `eslint.config.mjs`:

```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import typeormTypescriptRecommended from 'eslint-plugin-typeorm-typescript/recommended';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  typeormTypescriptRecommended,
);
```

If you want to change the options, enable the plugin and the rules manually:

```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import typeormTypescriptPlugin from 'eslint-plugin-typeorm-typescript';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {'typeorm-typescript': typeormTypescriptPlugin},
    rules: {
      "typeorm-typescript/enforce-column-types": "error",
      "typeorm-typescript/enforce-relation-types": "warn",
      "typeorm-typescript/enforce-consistent-nullability": ["error", { "specifyNullable": "always" }]
    }
  }
);
```
