import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const checks = [];

function addCheck(label, passed, details = "") {
  checks.push({ label, passed, details });
}

function read(path) {
  return readFileSync(resolve(path), "utf8");
}

const capacitorConfig = read("capacitor.config.ts");
const infoPlist = read("ios/App/App/Info.plist");
const xcodeProject = read("ios/App/App.xcodeproj/project.pbxproj");

addCheck(
  "Capacitor uses production domain",
  capacitorConfig.includes('url: "https://smartrecipeapp.com"'),
  "Expected https://smartrecipeapp.com",
);

addCheck(
  "Capacitor app id is correct",
  capacitorConfig.includes('appId: "com.smartrecipeapp.app"'),
  "Expected com.smartrecipeapp.app",
);

addCheck(
  "Bundle ID is correct",
  xcodeProject.includes("PRODUCT_BUNDLE_IDENTIFIER = com.smartrecipeapp.app;"),
  "Expected com.smartrecipeapp.app",
);

addCheck(
  "App is iPhone-only",
  xcodeProject.includes("TARGETED_DEVICE_FAMILY = 1;"),
  "Expected TARGETED_DEVICE_FAMILY = 1",
);

addCheck(
  "App uses portrait orientation",
  infoPlist.includes("UIInterfaceOrientationPortrait"),
  "Expected portrait orientation",
);

addCheck(
  "Export compliance flag is present",
  infoPlist.includes("ITSAppUsesNonExemptEncryption"),
  "Expected ITSAppUsesNonExemptEncryption=false",
);

const versionMatches = [...xcodeProject.matchAll(/MARKETING_VERSION = ([0-9.]+);/g)];
const buildMatches = [...xcodeProject.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)];
const versions = [...new Set(versionMatches.map((match) => match[1]))];
const builds = [...new Set(buildMatches.map((match) => match[1]))];

addCheck(
  "iOS marketing version is consistent",
  versions.length === 1,
  versions.length ? `Found: ${versions.join(", ")}` : "No version found",
);

addCheck(
  "iOS build number is consistent",
  builds.length === 1,
  builds.length ? `Found: ${builds.join(", ")}` : "No build number found",
);

const permissionKeys = [
  "NSCameraUsageDescription",
  "NSMicrophoneUsageDescription",
  "NSLocationWhenInUseUsageDescription",
  "NSPhotoLibraryUsageDescription",
  "NSContactsUsageDescription",
];

const unusedPermissionKeys = permissionKeys.filter((key) => infoPlist.includes(key));

addCheck(
  "No unused sensitive iOS permissions",
  unusedPermissionKeys.length === 0,
  unusedPermissionKeys.length
    ? `Found: ${unusedPermissionKeys.join(", ")}`
    : "No camera/mic/location/photo/contact keys found",
);

const requiredDocs = [
  ["Privacy page", "src/app/privacy/page.tsx"],
  ["Terms page", "src/app/terms/page.tsx"],
  ["Support page", "src/app/support/page.tsx"],
  ["About page", "src/app/about/page.tsx"],
  ["App Store draft", "APP_STORE.md"],
  ["Privacy App Store draft", "PRIVACY_APP_STORE.md"],
  ["Release checklist", "RELEASE_CHECKLIST.md"],
  ["Test plan", "TEST_PLAN.md"],
];

for (const [label, path] of requiredDocs) {
  addCheck(label, existsSync(resolve(path)), path);
}

const appIconDir = resolve("ios/App/App/Assets.xcassets/AppIcon.appiconset");
const splashDir = resolve("ios/App/App/Assets.xcassets/Splash.imageset");
const appIconFiles = existsSync(appIconDir)
  ? readdirSync(appIconDir).filter((file) => file.endsWith(".png"))
  : [];
const splashFiles = existsSync(splashDir)
  ? readdirSync(splashDir).filter((file) => file.endsWith(".png"))
  : [];

addCheck(
  "iOS app icons exist",
  appIconFiles.length >= 10,
  `Found ${appIconFiles.length} PNG files`,
);

addCheck(
  "iOS splash assets exist",
  splashFiles.length >= 1,
  `Found ${splashFiles.length} PNG files`,
);

console.log("SmartRecipe iOS release audit\n");

for (const check of checks) {
  const icon = check.passed ? "✓" : "✗";
  console.log(`${icon} ${check.label}`);
  if (check.details) {
    console.log(`  ${check.details}`);
  }
}

const failedChecks = checks.filter((check) => !check.passed);

if (versions.length === 1 && builds.length === 1) {
  console.log(`\nCurrent iOS version: ${versions[0]}`);
  console.log(`Current iOS build: ${builds[0]}`);
}

if (failedChecks.length > 0) {
  console.error(`\n${failedChecks.length} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll local iOS release checks passed.");
