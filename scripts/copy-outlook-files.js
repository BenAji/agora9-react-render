/**
 * Script to copy Outlook Add-in files to build directory after React build
 * 
 * This script is run automatically after `npm run build` when using `npm run build:outlook`
 * It copies manifest.xml, taskpane.html, and commands.html to the build directory
 * and injects React bundle scripts into taskpane.html so the React app loads.
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
  'commands.html',
];

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('Build directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

// Copy each file (except taskpane.html which needs special handling)
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

// Special handling for taskpane.html - inject React bundle scripts
const indexHtmlPath = path.join(buildDir, 'index.html');
const taskpaneSourcePath = path.join(sourceDir, 'taskpane.html');
const taskpaneDestPath = path.join(buildDir, 'taskpane.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('index.html not found in build directory. React build may have failed.');
  process.exit(1);
}

if (!fs.existsSync(taskpaneSourcePath)) {
  console.warn(`⚠ taskpane.html not found: ${taskpaneSourcePath}`);
} else {
  // Read the built index.html to extract script and link tags
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Extract script tags (both regular and module scripts)
  const scriptRegex = /<script[^>]*><\/script>|<script[^>]*>[\s\S]*?<\/script>/gi;
  const scripts = indexHtml.match(scriptRegex) || [];
  
  // Extract link tags for CSS
  const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi;
  const links = indexHtml.match(linkRegex) || [];
  
  // Read taskpane.html
  let taskpaneHtml = fs.readFileSync(taskpaneSourcePath, 'utf8');
  
  // Find where to inject scripts (before closing </body> tag)
  const bodyCloseIndex = taskpaneHtml.lastIndexOf('</body>');
  
  if (bodyCloseIndex === -1) {
    console.error('taskpane.html does not have a </body> tag');
    process.exit(1);
  }
  
  // Inject CSS links before </head> if it exists, otherwise before </body>
  const headCloseIndex = taskpaneHtml.lastIndexOf('</head>');
  if (headCloseIndex !== -1) {
    const cssInjection = '\n    ' + links.join('\n    ') + '\n';
    taskpaneHtml = taskpaneHtml.slice(0, headCloseIndex) + cssInjection + taskpaneHtml.slice(headCloseIndex);
  }
  
  // Inject script tags before </body>
  const scriptsInjection = '\n    ' + scripts.join('\n    ') + '\n';
  taskpaneHtml = taskpaneHtml.slice(0, bodyCloseIndex) + scriptsInjection + taskpaneHtml.slice(bodyCloseIndex);
  
  // Write the updated taskpane.html
  fs.writeFileSync(taskpaneDestPath, taskpaneHtml, 'utf8');
  console.log(`✓ Copied and injected React scripts into taskpane.html`);
}

console.log('Outlook Add-in files copied successfully!');
