const fg = require("fast-glob");
const path = require("path");

const packageJson = require("./package.json");

const dirPaths = fg.sync(packageJson.workspaces, {
  onlyFiles: false,
  markDirectories: true,
});
// manually adding "deps" as scope for dependabot PRs
const scopes = [
  ...dirPaths.map((dirPath) => path.basename(dirPath)),
  "deps",
];

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", scopes],
    "subject-case": [0, "never"],
  },
};
