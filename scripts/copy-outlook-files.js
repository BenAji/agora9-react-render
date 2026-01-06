/**
 * Script to copy Outlook Add-in files to build directory after React build
 * 
 * This script is run automatically after `npm run build` when using `npm run build:outlook`
 * It copies manifest.xml, taskpane.html, and commands.html to the build directory
 * so they're accessible when the app is deployed.
 * 
 * For taskpane.html, it injects the React bundle scripts from the built index.html
 * so the React app can load properly in the Outlook Task Pane.
 * 
 * @module scripts/copy-outlook-files
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'outlook-addin');
const buildDir = path.join(__dirname, '..', 'build');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('Build directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

// Copy manifest.xml
const manifestSource = path.join(sourceDir, 'manifest.xml');
const manifestDest = path.join(buildDir, 'manifest.xml');
if (fs.existsSync(manifestSource)) {
  fs.copyFileSync(manifestSource, manifestDest);
  console.log('✓ Copied manifest.xml to build directory');
} else {
  console.warn(`⚠ File not found: ${manifestSource}`);
}

// Copy commands.html
const commandsSource = path.join(sourceDir, 'commands.html');
const commandsDest = path.join(buildDir, 'commands.html');
if (fs.existsSync(commandsSource)) {
  fs.copyFileSync(commandsSource, commandsDest);
  console.log('✓ Copied commands.html to build directory');
} else {
  console.warn(`⚠ File not found: ${commandsSource}`);
}

// For taskpane.html, we need to inject React bundle scripts
const taskpaneSource = path.join(sourceDir, 'taskpane.html');
const taskpaneDest = path.join(buildDir, 'taskpane.html');
const indexHtmlPath = path.join(buildDir, 'index.html');

if (!fs.existsSync(taskpaneSource)) {
  console.warn(`⚠ File not found: ${taskpaneSource}`);
} else if (!fs.existsSync(indexHtmlPath)) {
  console.warn(`⚠ Built index.html not found: ${indexHtmlPath}`);
  // Fallback: just copy the taskpane.html as-is
  fs.copyFileSync(taskpaneSource, taskpaneDest);
  console.log('✓ Copied taskpane.html to build directory (without React bundles)');
} else {
  // Read the built index.html to extract script and link tags
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Extract script tags (for JS bundles only)
  const scriptMatches = indexHtml.match(/<script[^>]*><\/script>|<script[^>]*>[\s\S]*?<\/script>/gi) || [];
  const scripts = scriptMatches.filter(script => 
    script.includes('static/js/')
  );
  
  // Extract link tags (for CSS)
  const linkMatches = indexHtml.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
  
  // Read the taskpane.html template
  let taskpaneHtml = fs.readFileSync(taskpaneSource, 'utf8');
  
  // Find where to inject scripts (before closing </body> tag)
  const bodyCloseIndex = taskpaneHtml.lastIndexOf('</body>');
  
  if (bodyCloseIndex !== -1) {
    // Build the script and link tags to inject
    let injectContent = '\n    <!-- React app bundles -->\n';
    
    // Add CSS links first
    linkMatches.forEach(link => {
      injectContent += `    ${link}\n`;
    });
    
    // Add JS scripts
    scripts.forEach(script => {
      injectContent += `    ${script}\n`;
    });
    
    // Inject before </body>
    taskpaneHtml = taskpaneHtml.slice(0, bodyCloseIndex) + injectContent + taskpaneHtml.slice(bodyCloseIndex);
    
    // Write the updated taskpane.html
    fs.writeFileSync(taskpaneDest, taskpaneHtml, 'utf8');
    console.log('✓ Created taskpane.html with React bundles injected');
  } else {
    // Fallback: just copy as-is
    fs.copyFileSync(taskpaneSource, taskpaneDest);
    console.log('✓ Copied taskpane.html to build directory (could not inject bundles)');
  }
}

console.log('Outlook Add-in files copied successfully!');

