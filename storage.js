// All keys saved by LegatoLearn are prefixed so they never collide with
// anything else that might use localStorage on the same domain.
const STORAGE_PREFIX = 'legatolearn:';

function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (err) {
    console.error('storageGet failed for', key, err);
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    // Can fail if localStorage is full, disabled, or in a private-browsing
    // mode that blocks it. We fail quietly rather than breaking the page.
    console.error('storageSet failed for', key, err);
    return false;
  }
}
