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
  'indexedDB',
  'localStorage',
  'pluginData',
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

async function finish(reload) {
  if (reload) {
    await reloadCurrentTab();
  }
}

async function removeSelectedData(origin) {
  const optionIds = [...metaOptions, ...deletionOptions];
  const options = await chrome.storage.sync.get(optionIds);

  await chrome.browsingData.remove({
    origins: [origin]
  }, {
    appcache: options.appcache,
    cacheStorage: options.cacheStorage,
    cookies: options.cookies,
    indexedDB: options.indexedDB,
    localStorage: options.localStorage,
    pluginData: options.pluginData,
    serviceWorkers: options.serviceWorkers,
    webSQL: options.webSQL
  })

  await finish(options.reload);
}

// Initialize settings on initial extension installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    postAction: POST_ACTION.RELOAD_TAB,
    appcache: true,
    cacheStorage: true,
    cookies: true,
    indexedDB: true,
    localStorage: true,
    pluginData: true,
    serviceWorkers: true,
    webSQL: true
  });
});

// toolbar button clicked
chrome.action.onClicked.addListener(async () => {
  setBusyIcon();
  setTimeout(() => setRestingIcon(), 1000);

  const activeTab = await getCurrentTab();
  const origin = await getOrigin(activeTab.url);
  await removeSelectedData(origin);
});
