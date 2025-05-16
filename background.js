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
  await chrome.tabs.update(activeTab.id, { url: activeTab.url });
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

function getDomain(url) {
  const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im);

  return match && match[0];
}

async function finish(reload) {
  if (reload) {
    await reloadCurrentTab();
  }
}

async function removeSelectedData(site) {
  const optionIds = ['reload', ...deletionOptions];

  const options = await chrome.storage.sync.get(optionIds);
  await chrome.browsingData.remove({
    origins: [site]
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
    reload: true,
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
  const domain = await getDomain(activeTab.url);
  await removeSelectedData(domain);
});
