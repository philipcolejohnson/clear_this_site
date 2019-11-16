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

const callback = () => {
  console.log('cleared!')
  setRestingIcon();

  reloadCurrentTab()
}

function removeAllData(site) {
  console.log('removing!')
  chrome.browsingData.remove({
    "origins": [site]
  }, {
    "cacheStorage": true,
    "cookies": true,
    "fileSystems": true,
    "indexedDB": true,
    "localStorage": true,
    "pluginData": true,
    "serviceWorkers": true,
    "webSQL": true
  }, callback);
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.message === "clear_data" ) {
      removeAllData(request.url);
    }
  }
);

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log("The color is green.");
  });
});

chrome.browserAction.onClicked.addListener(function(tab) {
  console.log('toolbar')
  setBusyIcon();

  // just in case
  setTimeout(() => setRestingIcon(), 2000);

  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log('tabs query')
    var activeTab = tabs[0];
    console.log(activeTab.url)
    
    chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    // removeAllData(activeTab.url);
  });
});