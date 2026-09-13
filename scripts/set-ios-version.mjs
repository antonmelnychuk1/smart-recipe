import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectFile = resolve("ios/App/App.xcodeproj/project.pbxproj");
const nextVersion = process.argv[2];

if (!nextVersion) {
  console.error("Usage: npm run ios:set-version -- 1.0.1");
  process.exit(1);
}

if (!/^\d+\.\d+(?:\.\d+)?$/.test(nextVersion)) {
  console.error("Version must use format x.y or x.y.z, for example 1.0 or 1.0.1.");
  process.exit(1);
}

const content = readFileSync(projectFile, "utf8");
const matches = [...content.matchAll(/MARKETING_VERSION = ([0-9.]+);/g)];

if (matches.length === 0) {
  console.error("Could not find MARKETING_VERSION in Xcode project.");
  process.exit(1);
}

const currentVersions = [...new Set(matches.map((match) => match[1]))];

if (currentVersions.length !== 1) {
  console.error(
    `Found different iOS marketing versions: ${currentVersions.join(", ")}. Please fix them manually first.`,
  );
  process.exit(1);
}

const currentVersion = currentVersions[0];

if (currentVersion === nextVersion) {
  console.error(`iOS marketing version is already ${nextVersion}.`);
  process.exit(1);
}

const nextContent = content.replaceAll(
  `MARKETING_VERSION = ${currentVersion};`,
  `MARKETING_VERSION = ${nextVersion};`,
);

writeFileSync(projectFile, nextContent);

console.log(`iOS marketing version changed: ${currentVersion} → ${nextVersion}`);
