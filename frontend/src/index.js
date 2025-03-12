import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

const rootElement = document.getElementById('root'); // ✅ Matches the ID in `index.html`

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
} else {
    console.error("Root element not found. Make sure there's a <div id='root'></div> in your index.html.");
}