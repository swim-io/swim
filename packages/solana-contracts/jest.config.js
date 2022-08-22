/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
// eslint-disable-next-line functional/immutable-data,import/no-commonjs,import/unambiguous,no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
