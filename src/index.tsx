import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppWithAuth from './AppWithAuth';
import { OfficeContextProvider } from './outlook/OfficeContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <OfficeContextProvider>
      <AppWithAuth />
    </OfficeContextProvider>
  </React.StrictMode>
);
