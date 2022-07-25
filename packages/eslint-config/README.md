# ESLint config

Shared default ESLint configuration for Swim TS projects.

## Installation

Install the package:

```sh
npm install --save-dev @swim-io/eslint-config
```

Install the required peer dependencies:

```sh
npm install --save-dev eslint eslint-config-prettier eslint-plugin-functional eslint-plugin-import eslint-plugin-jest eslint-plugin-prettier
```

For TS projects also install these optional dependencies:

```sh
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-deprecation
```

## Usage

In TS projects extend from the default config in your ESLint configuration file:

```json
{
  "extends": ["@swim-io"]
}
```

In JS projects extend from the JS-only config:

```json
{
  "extends": ["@swim-io/eslint-config/js-only"]
}
```
