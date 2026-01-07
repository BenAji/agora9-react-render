import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppWithAuth from './AppWithAuth';
import { OfficeContextProvider } from './outlook/OfficeContext';
import ErrorBoundary from './components/ErrorBoundary';

// Ensure root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);

// Wrap in error boundary to catch initialization errors
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <OfficeContextProvider>
        <AppWithAuth />
      </OfficeContextProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
