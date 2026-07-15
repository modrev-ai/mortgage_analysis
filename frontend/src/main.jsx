import React from 'react';
import ReactDOM from 'react-dom/client';
import { MortgageProvider } from './mortgage_context.jsx';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MortgageProvider>
      <App />
    </MortgageProvider>
  </React.StrictMode>,
);
