/**
 * Script to copy Outlook Add-in files to build directory after React build
 * 
 * This script is run automatically after `npm run build` when using `npm run build:outlook`
 * It copies manifest.xml, taskpane.html, and commands.html to the build directory
 * so they're accessible when the app is deployed.
 * 
 * @module scripts/copy-outlook-files
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'outlook-addin');
const buildDir = path.join(__dirname, '..', 'build');

// Files to copy
const filesToCopy = [
  'manifest.xml',
  'taskpane.html',
  'commands.html',
];

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('Build directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

// Copy each file
filesToCopy.forEach((file) => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(buildDir, file);

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied ${file} to build directory`);
  } else {
    console.warn(`⚠ File not found: ${sourcePath}`);
  }
});

console.log('Outlook Add-in files copied successfully!');
