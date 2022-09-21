"use strict";

const JsDomEnvironment = require("jest-environment-jsdom");

module.exports = class CustomJsDomEnvironment extends JsDomEnvironment {
  constructor(config) {
    super({
      ...config,
      globals: {
        ...config.globals,
        // fix for https://github.com/facebook/jest/issues/4422
        Uint8Array: global.Uint8Array,
        ArrayBuffer: global.ArrayBuffer,
      },
    });
  }
};
