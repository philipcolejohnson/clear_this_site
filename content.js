console.log('contentjs')
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log('clicked')
    if (request.message == "clicked_browser_action") {
      const href = window.location.href

      chrome.runtime.sendMessage({"message": "clear_data", "url": href});
    }
  }
 );
 