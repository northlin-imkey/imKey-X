
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Index.tsx is running...');

const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.innerHTML = '<h1 style="color: green; padding: 20px;">DEBUG: REACT MOUNTING...</h1>';
}
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
