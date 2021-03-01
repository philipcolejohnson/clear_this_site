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

function reloadCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
  });
}

function setRestingIcon() {
  chrome.action.setIcon({
    path: {
      "16": "images/trash-16.png",
      "32": "images/trash-32.png",
      "48": "images/trash-48.png",
      "128": "images/trash-128.png"
    }
  });
}

function setBusyIcon() {
  chrome.action.setIcon({
    path: {
      "16": "images/browser-16.png",
      "32": "images/browser-32.png",
      "48": "images/browser-48.png",
      "128": "images/browser-128.png"
    }
  });
}

function getDomain(url) {
  const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im);
  
  return match && match[0];
}

const finish = (reload) => {
  if (reload) {
    reloadCurrentTab();
  }
}

function removeAllData(site) {
  const optionIds = ['reload', ...deletionOptions];

  chrome.storage.sync.get(optionIds, results => {
    chrome.browsingData.remove({
      origins: [site]
    }, {
      appcache: results.appcache,
      cacheStorage: results.cacheStorage,
      cookies: results.cookies,
      indexedDB: results.indexedDB,
      localStorage: results.localStorage,
      pluginData: results.pluginData,
      serviceWorkers: results.serviceWorkers,
      webSQL: results.webSQL
    }, () => finish(results.reload));
  });
}

// Initialize settings on install
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
chrome.action.onClicked.addListener((tab) => {
  setBusyIcon();
  setTimeout(() => setRestingIcon(), 1000);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    var activeTab = tabs[0];
    
    const domain = getDomain(activeTab.url);
    removeAllData(domain);
  });
});
