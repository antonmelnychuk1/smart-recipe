import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const nextVersion = args.find((arg) => !arg.startsWith("-"));
const dryRun = args.includes("--dry-run");
const projectFile = resolve("ios/App/App.xcodeproj/project.pbxproj");

const commands = [
  ["npm", ["run", "lint"]],
  ["npm", ["run", "build"]],
  ["npx", ["cap", "sync"]],
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!nextVersion) {
  fail("Usage: npm run ios:prepare-release -- 1.0.1 [--dry-run]");
}

if (!/^\d+\.\d+(?:\.\d+)?$/.test(nextVersion)) {
  fail("Version must use format x.y or x.y.z, for example 1.0 or 1.0.1.");
}

const content = readFileSync(projectFile, "utf8");
const versionMatches = [...content.matchAll(/MARKETING_VERSION = ([0-9.]+);/g)];
const buildMatches = [...content.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)];

if (versionMatches.length === 0) {
  fail("Could not find MARKETING_VERSION in Xcode project.");
}

if (buildMatches.length === 0) {
  fail("Could not find CURRENT_PROJECT_VERSION in Xcode project.");
}

const currentVersions = [...new Set(versionMatches.map((match) => match[1]))];
const currentBuilds = [...new Set(buildMatches.map((match) => Number(match[1])))];

if (currentVersions.length !== 1) {
  fail(
    `Found different iOS marketing versions: ${currentVersions.join(", ")}. Please fix them manually first.`,
  );
}

if (currentBuilds.length !== 1) {
  fail(
    `Found different iOS build numbers: ${currentBuilds.join(", ")}. Please fix them manually first.`,
  );
}

const currentVersion = currentVersions[0];
const currentBuild = currentBuilds[0];
const nextBuild = currentBuild + 1;

let nextContent = content.replaceAll(
  `CURRENT_PROJECT_VERSION = ${currentBuild};`,
  `CURRENT_PROJECT_VERSION = ${nextBuild};`,
);

if (nextVersion !== currentVersion) {
  nextContent = nextContent.replaceAll(
    `MARKETING_VERSION = ${currentVersion};`,
    `MARKETING_VERSION = ${nextVersion};`,
  );
}

console.log("iOS release preparation");
console.log(`Version: ${currentVersion} → ${nextVersion}`);
console.log(`Build: ${currentBuild} → ${nextBuild}`);

if (dryRun) {
  console.log("\nDry run mode. No files were changed and no commands were run.");
  console.log("\nCommands that would run:");
  for (const [command, commandArgs] of commands) {
    console.log(`- ${command} ${commandArgs.join(" ")}`);
  }
  process.exit(0);
}

writeFileSync(projectFile, nextContent);

for (const [command, commandArgs] of commands) {
  console.log(`\nRunning: ${command} ${commandArgs.join(" ")}`);
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    fail(`Command failed: ${command} ${commandArgs.join(" ")}`);
  }
}

console.log("\nDone.");
console.log(`iOS version: ${nextVersion}`);
console.log(`iOS build number: ${nextBuild}`);
console.log("Next step: open Xcode and create an Archive for upload.");
