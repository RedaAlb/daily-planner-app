/* global __APP_COMMIT_SHA__, __APP_BRANCH__, __APP_BUILD_TIME__ */

export const APP_COMMIT_SHA =
  typeof __APP_COMMIT_SHA__ !== 'undefined' ? __APP_COMMIT_SHA__ : 'dev';

export const APP_BRANCH =
  typeof __APP_BRANCH__ !== 'undefined' ? __APP_BRANCH__ : 'local';

export const APP_BUILD_TIME =
  typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : '';

export const formatBuildTime = (isoString = APP_BUILD_TIME) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const getVersionSummary = ({
  branch = APP_BRANCH,
  commitSha = APP_COMMIT_SHA,
  buildTime = APP_BUILD_TIME
} = {}) => {
  const base = `${branch}@${commitSha}`;
  const formattedTime = formatBuildTime(buildTime);
  return formattedTime ? `${base} · ${formattedTime}` : base;
};

/**
 * Forces the PWA service worker to check for a newer deployed build.
 * Returns one of: 'updated' | 'up-to-date' | 'unsupported' | 'error'.
 */
export const checkForAppUpdate = async ({
  reload = () => window.location.reload(),
  reloadDelayMs = 800,
  activationTimeoutMs = 5000
} = {}) => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return 'unsupported';
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return 'unsupported';
    }

    let updateFound = false;
    const onUpdateFound = () => {
      updateFound = true;
    };
    registration.addEventListener?.('updatefound', onUpdateFound);

    try {
      await registration.update();
    } finally {
      registration.removeEventListener?.('updatefound', onUpdateFound);
    }

    const hasNewWorker = Boolean(updateFound || registration.waiting || registration.installing);
    if (!hasNewWorker) {
      return 'up-to-date';
    }

    // Trigger immediate activation if a worker is already waiting.
    if (registration.waiting) {
      registration.waiting.postMessage?.({ type: 'SKIP_WAITING' });
    }

    // Wait for the new service worker to take control (or fall back to a timed reload).
    await new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        navigator.serviceWorker.removeEventListener?.('controllerchange', onControllerChange);
        clearTimeout(timeoutId);
        resolve();
      };

      const onControllerChange = () => finish();
      navigator.serviceWorker.addEventListener?.('controllerchange', onControllerChange);

      // If installing, also listen for it to reach installed/activated state
      if (registration.installing) {
        registration.installing.addEventListener?.('statechange', (e) => {
          const state = e.target?.state;
          if (state === 'installed' && registration.waiting) {
            registration.waiting.postMessage?.({ type: 'SKIP_WAITING' });
          } else if (state === 'activated') {
            finish();
          }
        });
      }

      const timeoutId = setTimeout(finish, activationTimeoutMs);
    });

    setTimeout(() => reload(), reloadDelayMs);
    return 'updated';
  } catch (err) {
    console.warn('Service worker update check failed:', err);
    return 'error';
  }
};
