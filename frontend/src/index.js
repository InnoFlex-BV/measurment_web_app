/**
 * Application entry point.
 *
 * This file is the first JavaScript file that runs when your application loads.
 * It imports React, finds the root DOM element, and renders the application.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Get the root DOM element where React will mount
// This element is defined in public/index.html as <div id="root"></div>
const rootElement = document.getElementById('root');

// Create a React root using the new React 18 API
// The root is a connection between React and the DOM
// React 18 introduced concurrent features that require this new API
const root = ReactDOM.createRoot(rootElement);

// Render the application
// React.StrictMode is a wrapper component that activates additional checks
// and warnings during development. It doesn't render anything visible.
// It helps catch common mistakes like:
// - Using deprecated lifecycle methods
// - Warning about legacy string ref API usage
// - Detecting unexpected side effects
// StrictMode intentionally double-invokes certain functions in development
// to help surface issues with side effects
// TODO: remove StrictMode for production
root.render(
    <React.StrictMode> 
        <App />
    </React.StrictMode>
);