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

In TS projects extend from the default config in your ESLint configuration file:

```js
module.exports = {
  extends: ["@swim-io"],
};
```

In JS projects extend from the JS-only config:

```js
module.exports = {
  extends: ["@swim-io/eslint-config/js-only"],
};
```

In React projects extend from the react config:

```js
module.exports = {
  extends: ["@swim-io/eslint-config/react"],
};
```

If you are using this config in monorepo, and experiencing the error `ESLint couldn't determine the plugin "xxx" uniquely`, you could apply this patch in your `.eslintrc.js`:

```js
require("@swim-io/eslint-config/patch/modern-module-resolution");
```
