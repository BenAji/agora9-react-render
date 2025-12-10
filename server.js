const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Cache static assets with long-term caching
app.use('/static', express.static(path.join(__dirname, 'build/static'), {
  maxAge: '1y',
  immutable: true
}));

// Cache manifest and favicon with shorter cache
app.use('/manifest.json', express.static(path.join(__dirname, 'build/manifest.json'), {
  maxAge: '1h'
}));

// Serve Outlook Add-in files
app.use('/manifest.xml', express.static(path.join(__dirname, 'build/manifest.xml'), {
  maxAge: '1h',
  type: 'application/xml'
}));

app.use('/taskpane.html', express.static(path.join(__dirname, 'build/taskpane.html'), {
  maxAge: '1h'
}));

app.use('/commands.html', express.static(path.join(__dirname, 'build/commands.html'), {
  maxAge: '1h'
}));

app.use('/favicon.ico', express.static(path.join(__dirname, 'build/favicon.ico'), {
  maxAge: '1d'
}));

// The "catchall" handler: send back React's index.html file for all routes
// This ensures React Router handles client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${path.join(__dirname, 'build')}`);
});
