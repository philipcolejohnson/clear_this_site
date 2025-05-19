const POST_ACTION = Object.freeze({
  DO_NOTHING: 'do-nothing',
  RELOAD_TAB: 'reload-tab',
  CLOSE_TAB: 'close-tab',
});

const metaOptions = [
  'postAction',
];
const deletionOptions = [
  'appcache',
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
  } else if (postAction === POST_ACTION.CLOSE_TAB) {
    await closeCurrentTab();
  }
}

async function getAllStoredOptions() {
  const optionIds = [...metaOptions, ...deletionOptions];
  return chrome.storage.sync.get(optionIds);
}

async function removeSelectedData(origin) {
  const options = await getAllStoredOptions();

  await chrome.browsingData.remove({
    origins: [origin]
  }, {
    appcache: options.appcache,
    cacheStorage: options.cacheStorage,
    cookies: options.cookies,
    fileSystems: options.fileSystems,
    indexedDB: options.indexedDB,
    localStorage: options.localStorage,
    pluginData: true, // this is deprecated and probably can be removed
    serviceWorkers: options.serviceWorkers,
    webSQL: options.webSQL
  })

  await finish(options.postAction);
}

// since we read the options from storage when clearing a site, this
// makes sure they are all present in storage
async function syncOptions() {
  const options = await getAllStoredOptions();
  await chrome.storage.sync.clear(); // make sure we start with a clean slate

  // Update option from previous version
  const postActionSetting = options.postAction ?? (options.reload === false ? POST_ACTION.DO_NOTHING : POST_ACTION.RELOAD_TAB);

  chrome.storage.sync.set({
    postAction: postActionSetting,
    appcache: options.appcache ?? true,
    cacheStorage: options.cacheStorage ?? true,
    cookies: options.cookies ?? true,
    fileSystems: options.fileSystems ?? true,
    indexedDB: options.indexedDB ?? true,
    localStorage: options.localStorage ?? true,
    serviceWorkers: options.serviceWorkers ?? true,
    webSQL: options.webSQL ?? true,
  });
}

// Initialize settings when extension is installed, updated, or Chrome is updated
// use cached values if available, otherwise use defaults
chrome.runtime.onInstalled.addListener(() => {
  syncOptions();
});

// Fired when a profile that has this extension installed first starts up
chrome.runtime.onStartup.addListener(() => {
  syncOptions();
});

// toolbar button clicked
chrome.action.onClicked.addListener(async () => {
  setBusyIcon();
  setTimeout(() => setRestingIcon(), 1000);

  const activeTab = await getCurrentTab();
  const origin = await getOrigin(activeTab.url);
  await removeSelectedData(origin);
});
