import { init as initLegacy } from './app-legacy.js';

/**
 * Shell router: `legacy` = full maquette; `gateway` = compliance UI + patient portal (booking test).
 * Default: legacy. Set VITE_SPA_MODE=gateway in .env to use the compliance shell.
 *
 * Legacy init is a static import so the maquette always loads in dev/prod; dynamic import here
 * can fail in some Vite HMR / chunk timing cases and left #app empty.
 */
export async function init() {
  const mode = import.meta.env.VITE_SPA_MODE || 'legacy';
  if (mode === 'gateway') {
    await import('./compliance-gateway.css');
    const m = await import('./compliance-gateway.js');
    return m.init();
  }
  return initLegacy();
}

// BOOKING_FLOW_RESTORE_START
// Public booking: implemented in `app-legacy.js` (hash `#/book`, inline split, `booking-wizard.js`).
// Removed prior `psynova_booking_bridge` IIFE that replaced `#app` and bypassed the real shell.
// BOOKING_FLOW_RESTORE_END
