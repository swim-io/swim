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

For React projects also install these optional dependencies:

```sh
npm install --save-dev @sayari/eslint-plugin eslint-config-react-app eslint-plugin-react
```

## Usage

In JS/TS projects extend from the default config in your ESLint configuration file `.eslintrc.cjs`:

```js
module.exports = {
  extends: ["@swim-io/eslint-config"],
};
```

For TS projects, mark the `tsconfigRootDir` for detecting `tsconfig.json` location:

```js
module.exports = {
  extends: ["@swim-io/eslint-config"],
  parserOptions: {
    // Make sure correct `tsconfig.json` is found in monorepo
    tsconfigRootDir: __dirname,
  },
};
```

In React projects extend from the react config:

```js
module.exports = {
  extends: ["@swim-io/eslint-config/react"],
};
```

If you are using this config in a monorepo, and experiencing the error `ESLint couldn't determine the plugin "xxx" uniquely`, you can apply this patch in your `.eslintrc.cjs` file to solve the issue:

```js
require("@swim-io/eslint-config/patch/modern-module-resolution.cjs");
```

## Known issues

1. ESLint has some issues in monorepo and with its [dependency resolve method](https://eslint.org/blog/2022/08/new-config-system-part-2/#:~:text=Use%20native%20loading,JavaScript%20runtime%20directly), which requires us to install ESLint plugins in both client and eslint-config itself.
   1. Will be solved by ESLint's [new flat config](https://eslint.org/blog/2022/08/new-config-system-part-1/).
