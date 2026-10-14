import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initWebApi } from './services/webApi';
import './styles/index.css';
import './styles/editor.css';
import './styles/diagrams.css';

// Initialize web API shim if running outside Electron
initWebApi();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
