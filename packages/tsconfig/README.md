# ESLint config

Shared default TypeScript configuration for Swim TS projects.

## Installation

Install the package:

```sh
npm install --save-dev @swim-io/tsconfig
```

## Usage

In TS projects extend from the default config in your ESLint configuration file:

```js
module.exports = {
  extends: ["@swim-io/tsconfig/tsconfig-base.json"],
};
```

In React projects extend from the react config:

```js
module.exports = {
  extends: ["@swim-io/tsconfig/tsconfig-react.json"],
};
```

In library projects extend from the library config:

```js
module.exports = {
  extends: ["@swim-io/tsconfig/tsconfig-library.json"],
};
```
