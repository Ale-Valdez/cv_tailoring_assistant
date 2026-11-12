import { createRequire } from "node:module";
import { cruise, format } from "dependency-cruiser";

const require = createRequire(import.meta.url);
const ruleSet = require("../.dependency-cruiser.cjs");

const cruiseResult = await cruise(["apps", "packages"], {
  validate: true,
  ruleSet,
});

if (typeof cruiseResult.output === "string") {
  process.stderr.write(cruiseResult.output);
  process.exit(1);
}

const result = cruiseResult.output;
const report = await format(result, { outputType: "err" });

if (typeof report.output === "string") {
  process.stdout.write(report.output);
}

const parserIssues = result.summary.environment?.issues ?? [];
if (parserIssues.length > 0) {
  process.exit(1);
}

process.exit(report.exitCode);
