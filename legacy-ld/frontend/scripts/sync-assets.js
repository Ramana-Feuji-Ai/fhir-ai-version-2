const { cpSync, existsSync, mkdirSync } = require("fs");
const { join } = require("path");

const rootAssets = join(__dirname, "..", "..", "assets");
const dest = join(__dirname, "..", "public", "assets");

if (!existsSync(rootAssets)) {
  console.log("No sibling ../assets folder; using frontend/public/assets if present.");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(rootAssets, dest, { recursive: true });
console.log("Copied repo-root assets/ into frontend/public/assets/");
