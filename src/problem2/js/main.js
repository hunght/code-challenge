// Main application entry point

import { createState } from './state.js';
import { loadTokenData } from './data-loading.js';
import { bindEvents } from './events.js';

// App initialization
async function init() {
  try {
    // Create initial state
    const state = createState();

    // Load token data
    await loadTokenData(state);

    // Bind all events
    bindEvents(state);

    // Initialize UI
    updateInitialUI(state);

    console.log('Currency Swap App initialized successfully');

  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

// Initialize UI state
function updateInitialUI(state) {
  // Set initial button state
  const btn = document.getElementById('swap-button');
  if (btn) {
    btn.disabled = true;
    btn.querySelector('.button-text').textContent = 'Select tokens to continue';
  }

  // Hide modals
  const tokenModal = document.getElementById('token-modal');
  const settingsModal = document.getElementById('settings-modal');
  if (tokenModal) tokenModal.style.display = 'none';
  if (settingsModal) settingsModal.style.display = 'none';
}

// Service Worker registration (avoid in dev)
if ('serviceWorker' in navigator && !(import.meta && import.meta.env && import.meta.env.DEV)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('App load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
    }, 0);
  });
}

// Start the app
init();
