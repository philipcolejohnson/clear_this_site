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
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
  });
}

function setRestingIcon() {
  chrome.browserAction.setIcon({
    path: {
      "16": "images/trash-16.png",
      "32": "images/trash-32.png",
      "48": "images/trash-48.png",
      "128": "images/trash-128.png"
    }
  });
}

function setBusyIcon() {
  chrome.browserAction.setIcon({
    path: {
      "16": "images/browser-16.png",
      "32": "images/browser-32.png",
      "48": "images/browser-48.png",
      "128": "images/browser-128.png"
    }
  });
}

const callback = (reload) => {
  setRestingIcon();

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
    }, () => callback(results.reload));
  });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.message === "clear_data" ) {
      removeAllData(request.url);
    }
  }
);

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

chrome.browserAction.onClicked.addListener((tab) => {
  setBusyIcon();

  // just in case
  setTimeout(() => setRestingIcon(), 2000);

  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    var activeTab = tabs[0];
    
    // chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    removeAllData(activeTab.url);
  });
});