/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
// eslint-disable-next-line functional/immutable-data,import/no-commonjs,import/unambiguous,no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 200000,
  globals: {
    "ts-jest": {
      isolatedModules: true,
      tsconfig: "./tsconfig-dev.json",
    },
  },
};
