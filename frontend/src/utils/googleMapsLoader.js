/**
 * googleMapsLoader
 *
 * Lazily loads the Google Maps JavaScript API exactly once, no matter
 * how many components request it concurrently (they all await the same
 * promise). Mirrors the same "load external script on demand" pattern
 * already used elsewhere in this project for Razorpay's checkout.js.
 *
 * We intentionally load the raw `maps.googleapis.com/maps/api/js` script
 * rather than adding a React wrapper library (e.g. @react-google-maps/api)
 * as a new dependency — this keeps the integration a pure addition with
 * zero new npm installs. If you later prefer the React wrapper, the
 * <DeliveryMap> component's internals are the only thing that would
 * need to change; its external prop API would stay identical.
 */
let loadPromise = null;

export function loadGoogleMaps(apiKey) {
  // Already loaded (e.g. by a previous mount) — resolve immediately.
  if (window.google?.maps) return Promise.resolve(window.google);

  // A load is already in flight — return the same promise so we never
  // inject the script tag twice.
  if (loadPromise) return loadPromise;

  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key not provided'));
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps-loader]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src   = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps-loader', 'true');
    script.onload  = () => resolve(window.google);
    script.onerror = () => {
      loadPromise = null; // allow retry on next call
      reject(new Error('Failed to load Google Maps script'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}