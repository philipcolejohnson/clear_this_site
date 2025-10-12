(async function initConfirm() {
  // Get the current tab (the one the user clicked the extension button on)
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  
  if (!activeTab) {
    window.close();
    return;
  }
  
  // Parse the origin from the tab URL
  const parsedUrl = new URL(activeTab.url);
  const origin = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
  
  // Display the site name
  const siteNameElement = document.getElementById('site-name');
  if (siteNameElement) {
    siteNameElement.textContent = origin;
  }

  // Handle cancel button
  document.getElementById('cancel-btn').addEventListener('click', () => {
    window.close();
  });

  // Handle confirm button
  document.getElementById('confirm-btn').addEventListener('click', async () => {
    // Send message to background script to proceed with clearing
    await chrome.runtime.sendMessage({ action: 'confirmClear', origin });
    window.close();
  });
})();
