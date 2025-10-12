const POST_ACTION = Object.freeze({
  DO_NOTHING: 'do-nothing',
  RELOAD_TAB: 'reload-tab',
  CLOSE_TAB: 'close-tab',
});

const metaOptions = [
  'emptyAllCache',
  'postAction',
  'showConfirmation',
];
const deletionOptions = [
  'appcache',
  'browserCache',
  'cacheStorage',
  'cookies',
  'fileSystems',
  'indexedDB',
  'localStorage',
  'serviceWorkers',
  'webSQL'
];

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs[0];
}

async function reloadCurrentTab() {
  const activeTab = await getCurrentTab();
  await chrome.tabs.reload(activeTab.id);
}

async function closeCurrentTab() {
  const activeTab = await getCurrentTab();
  await chrome.tabs.remove(activeTab.id);
}

function setRestingIcon() {
  chrome.action.setIcon({
    path: {
      "16": "images/inactive-16.png",
      "32": "images/inactive-32.png",
      "48": "images/inactive-48.png",
      "128": "images/inactive-128.png"
    }
  });
}

function setBusyIcon() {
  chrome.action.setIcon({
    path: {
      "16": "images/active-16.png",
      "32": "images/active-32.png",
      "48": "images/active-48.png",
      "128": "images/active-128.png"
    }
  });
}

function getOrigin(url) {
  const parsedUrl = new URL(url);
  return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
}

async function finish(postAction) {
  if (postAction === POST_ACTION.RELOAD_TAB) {
    await reloadCurrentTab();
  }
}

async function getAllStoredOptions() {
  const optionIds = [...metaOptions, ...deletionOptions];
  const syncOptions = await chrome.storage.sync.get(optionIds);
  const localOptions = await chrome.storage.local.get(optionIds);
  // merge sync and local options, with local options taking precedence
  return { ...syncOptions, ...localOptions };
}

async function getLocalStoredOptions() {
    const optionIds = [...metaOptions, ...deletionOptions];
    return chrome.storage.local.get(optionIds);
}

async function removeSelectedData(origin, customOptions = null) {
  const options = customOptions || await getLocalStoredOptions();

  // Do this first to prevent site from reacting to the deletion
  if (options.postAction === POST_ACTION.CLOSE_TAB) {
    await closeCurrentTab();
  }

  await chrome.browsingData.remove({
    origins: [origin]
  }, {
    cache: options.browserCache,
    cacheStorage: options.cacheStorage,
    cookies: options.cookies,
    fileSystems: options.fileSystems,
    indexedDB: options.indexedDB,
    localStorage: options.localStorage,
    serviceWorkers: options.serviceWorkers,
    webSQL: options.webSQL
  });

  if (options.emptyAllCache) {
    await chrome.browsingData.removeCache({});
  }

  await finish(options.postAction);
}

// since we read the options from storage when clearing a site, this
// makes sure they are all present in storage
async function rebuildOptions(options = {}) {
  await chrome.storage.local.clear(); // make sure we start with a clean slate

  // Update option from legacy extension options
  const postActionSetting = options.postAction ?? (options.reload === false ? POST_ACTION.DO_NOTHING : POST_ACTION.RELOAD_TAB);

  chrome.storage.local.set({
    postAction: postActionSetting,
    emptyAllCache: options.emptyAllCache ?? false,
    showConfirmation: options.showConfirmation ?? false,
    appcache: options.appcache ?? true,
    browserCache: options.browserCache ?? false,
    cacheStorage: options.cacheStorage ?? true,
    cookies: options.cookies ?? true,
    fileSystems: options.fileSystems ?? true,
    indexedDB: options.indexedDB ?? true,
    localStorage: options.localStorage ?? true,
    serviceWorkers: options.serviceWorkers ?? true,
    webSQL: options.webSQL ?? true,
  });
}

async function runClearAction() {
  setBusyIcon();
  setTimeout(() => setRestingIcon(), 1000);

  const activeTab = await getCurrentTab();
  const origin = getOrigin(activeTab.url);
  await removeSelectedData(origin);
}

// Initialize settings when extension is installed, updated, or Chrome is updated
// use cached values if available, otherwise use defaults
chrome.runtime.onInstalled.addListener(() => {
  // check synced options upon install, in case user already has extension installed on another device
  getAllStoredOptions().then(options => rebuildOptions(options));
});

// Fired when a profile that has this extension installed first starts up
chrome.runtime.onStartup.addListener(() => {
  getLocalStoredOptions().then(options => rebuildOptions(options));
});

// This handler will only be called if no popup is set
// and extension button is clicked
chrome.action.onClicked.addListener(async () => {
  // the confirmation is disabled, proceed directly
  await runClearAction();
});

// Check before each potential click whether to show popup or handle directly
// We do this by updating the popup setting dynamically
async function updatePopupBehavior() {
  const options = await getLocalStoredOptions();
  
  if (options.showConfirmation) {
    // Enable the popup
    await chrome.action.setPopup({ popup: 'confirm.html' });
  } else {
    // Disable the popup so onClicked fires instead
    await chrome.action.setPopup({ popup: '' });
  }
}

// Update popup behavior when storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (changes.showConfirmation) {
    updatePopupBehavior();
  }
});

// Initialize popup behavior on startup
updatePopupBehavior();

// Handle confirmation message from the popup
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'confirmClear') {
    setBusyIcon();
    setTimeout(() => setRestingIcon(), 1000);
    
    // Use the custom options from the popup if provided, otherwise use stored options
    const storedOptions = await getLocalStoredOptions();
    const optionsToUse = {
      ...storedOptions,
      ...message.options // Override with popup selections
    };
    
    await removeSelectedData(message.origin, optionsToUse);
  }
});
