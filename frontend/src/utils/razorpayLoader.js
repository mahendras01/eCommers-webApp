/**
 * Razorpay Script Loader
 * 
 * Dynamically loads the Razorpay checkout script from CDN
 * and caches it to avoid loading the same script multiple times
 */

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

// Cache to store the loading promise
let scriptLoadingPromise = null;
let scriptLoaded = false;

/**
 * Load Razorpay script dynamically
 * 
 * Features:
 * - Loads script once from CDN
 * - Caches the loading promise (subsequent calls return cached promise)
 * - Prevents race conditions during concurrent load attempts
 * - Makes Razorpay object available globally on window
 * 
 * @returns {Promise<void>} Resolves when script is loaded, rejects on error
 * @throws {Error} If script fails to load (network error, missing Razorpay object)
 * 
 * @example
 * // First call - loads from CDN
 * await loadRazorpayScript();
 * 
 * // Subsequent calls - returns cached promise (no duplicate loads)
 * await loadRazorpayScript();
 * 
 * // Now Razorpay is available globally
 * const rzp = new window.Razorpay({ ...options });
 */
export const loadRazorpayScript = () => {
  // If script already loaded, resolve immediately
  if (scriptLoaded && window.Razorpay) {
    if (import.meta.env.DEV) console.log('Razorpay script already loaded');
    return Promise.resolve();
  }

  // If script is currently loading, return the existing promise
  // This prevents duplicate loads if called multiple times concurrently
  if (scriptLoadingPromise) {
    if (import.meta.env.DEV) console.log('Razorpay script loading in progress');
    return scriptLoadingPromise;
  }

  if (import.meta.env.DEV) console.log('Loading Razorpay script from CDN...');

  // Create a new loading promise
  scriptLoadingPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists in DOM
    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    
    if (existingScript) {
      // If script tag exists, wait for it to load
      if (window.Razorpay) {
        scriptLoaded = true;
        resolve();
        return;
      }
      
      // Attach event listeners to existing script
      existingScript.addEventListener('load', () => {
        scriptLoaded = true;
        resolve();
      });
      
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load Razorpay script'));
      });
      
      return;
    }

    // Create new script tag
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.type = 'text/javascript';

    // Handle successful load
    script.addEventListener('load', () => {
      // Verify Razorpay object is available
      if (window.Razorpay) {
        scriptLoaded = true;
        if (import.meta.env.DEV) console.log('Razorpay script loaded successfully');
        resolve();
      } else {
        if (import.meta.env.DEV) console.error('Razorpay script loaded but window.Razorpay not available');
        reject(new Error('Razorpay object not available after script load'));
      }
    });

    // Handle load errors
    script.addEventListener('error', () => {
      scriptLoadingPromise = null; // Reset promise on error to allow retry
      reject(new Error('Failed to load Razorpay script from CDN'));
    });

    // Append script to document head
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
};

/**
 * Check if Razorpay script is already loaded
 * 
 * @returns {boolean} True if Razorpay is available globally
 */
export const isRazorpayLoaded = () => {
  return scriptLoaded && window.Razorpay;
};

/**
 * Reset script loader state (useful for testing)
 * 
 * @internal
 */
export const resetRazorpayLoader = () => {
  scriptLoaded = false;
  scriptLoadingPromise = null;
};
