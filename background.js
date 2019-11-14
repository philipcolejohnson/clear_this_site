const callback = () => {
  console.log('cleared!')
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
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log('tabs query')
    var activeTab = tabs[0];
    console.log(activeTab.url)
    
    chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    // removeAllData(activeTab.url);
  });
});