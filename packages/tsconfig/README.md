# TypeScript config

Shared default TypeScript configuration for Swim TS projects.

## Installation

Install the package:

```sh
npm install --save-dev @swim-io/tsconfig
```

## Usage

In TS projects extend from the default config in your TypeScript configuration file:

```json
{
  "extends": "@swim-io/tsconfig/tsconfig-base.json"
}
```

In React projects extend from the react config:

```json
{
  "extends": "@swim-io/tsconfig/tsconfig-react.json"
}
```

In library projects extend from the library config:

```json
{
  "extends": "@swim-io/tsconfig/tsconfig-library.json"
}
```
