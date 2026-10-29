// Script to fix @coveo/atomic-legacy stub package
const fs = require("fs");
const path = require("path");

const legacyDir = path.join(__dirname, "../node_modules/@coveo/atomic-legacy");

// Create stub files if they don't exist
const stubContent = "export default {};";

const files = ["index.js", "atomic-suggestion-renderer.js"];

files.forEach((file) => {
  const filePath = path.join(legacyDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, stubContent, "utf8");
    console.log(`Created ${file}`);
  }
});

console.log("@coveo/atomic-legacy stubs created successfully");
