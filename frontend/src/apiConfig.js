/**
 * API Configuration for GreenPastures
 * 
 * In development (Vite dev server), the proxy handles /api requests.
 * In production / Android APK, we need an absolute URL to the Flask backend.
 * 
 * To change the backend address:
 *   1. Edit the API_BASE below to your computer's LAN IP or cloud URL
 *   2. Rebuild: npm run build && npx cap sync
 */

// Detect if running inside Capacitor (Android app) or a production build
const isProduction = import.meta.env.PROD;

// In dev mode, Vite proxy handles /api → Flask. In production, use the absolute URL.
// Change this IP to your computer's LAN IP or cloud backend URL.
const API_BASE = isProduction ? 'https://eshwarzz.pythonanywhere.com' : '';

/**
 * Helper to build full API URLs.
 * Usage: fetch(api('/api/cattle'))
 */
export function api(path) {
  return API_BASE + path;
}

export default API_BASE;
