// router.js — lightweight hash-based SPA router

const _routes   = {};
let   _current  = null;
let   _default  = '#tracker';

/**
 * Register a route handler.
 * @param {string}   hash    e.g. '#tracker'
 * @param {Function} handler called with no arguments when route activates
 */
export function route(hash, handler) {
  _routes[hash] = handler;
}

/**
 * Set the default route (used when hash is empty or '/').
 */
export function setDefault(hash) {
  _default = hash;
}

/**
 * Programmatically navigate to a hash route.
 */
export function navigate(hash) {
  window.location.hash = hash;
}

/**
 * Start the router — call once after all routes are registered.
 * Dispatches the current hash immediately.
 */
export function startRouter() {
  window.addEventListener('hashchange', _dispatch);
  _dispatch();
}

/** Get the currently active route hash. */
export function getCurrentRoute() {
  return _current;
}

// ──────────────────────────────────────────────────────────────

function _dispatch() {
  const raw  = window.location.hash || '';
  const hash = raw && raw !== '#' ? raw.split('?')[0] : _default;

  // Redirect to default if no match
  if (!_routes[hash]) {
    navigate(_default);
    return;
  }

  _current = hash;

  // Update nav active state
  document.querySelectorAll('[data-route]').forEach(el => {
    el.classList.toggle('active', el.dataset.route === hash);
  });

  // Render the page into #content
  const content = document.getElementById('content');
  if (content) content.innerHTML = '';

  _routes[hash]();
}
