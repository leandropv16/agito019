import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "..",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.spec.json" }],
  },
  testEnvironment: "node",
  moduleNameMapper: {
    "^@agito019/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default config;
