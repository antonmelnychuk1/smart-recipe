import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectFile = resolve("ios/App/App.xcodeproj/project.pbxproj");
const requestedBuild = process.argv[2];
const content = readFileSync(projectFile, "utf8");
const matches = [...content.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)];

if (matches.length === 0) {
  console.error("Could not find CURRENT_PROJECT_VERSION in Xcode project.");
  process.exit(1);
}

const currentBuilds = [...new Set(matches.map((match) => Number(match[1])))];

if (currentBuilds.length !== 1) {
  console.error(
    `Found different iOS build numbers: ${currentBuilds.join(", ")}. Please fix them manually first.`,
  );
  process.exit(1);
}

const currentBuild = currentBuilds[0];
const nextBuild =
  requestedBuild === undefined ? currentBuild + 1 : Number(requestedBuild);

if (!Number.isInteger(nextBuild) || nextBuild <= currentBuild) {
  console.error(
    `Next build number must be an integer greater than ${currentBuild}.`,
  );
  process.exit(1);
}

const nextContent = content.replaceAll(
  `CURRENT_PROJECT_VERSION = ${currentBuild};`,
  `CURRENT_PROJECT_VERSION = ${nextBuild};`,
);

writeFileSync(projectFile, nextContent);

console.log(`iOS build number bumped: ${currentBuild} → ${nextBuild}`);
