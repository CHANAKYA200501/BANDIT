import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { HashRouter } from 'react-router-dom'

console.log("[PhishShield+] Initializing SOC Platform Context...");

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("CRITICAL: Root element not found");

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  );
  console.log("[PhishShield+] SOC Platform Mounted Successfully.");
} catch (error) {
  console.error("[PhishShield+] Initialization Failure:", error);
}
