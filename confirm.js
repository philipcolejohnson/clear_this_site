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

  // Load current options from storage and populate the form
  const deletionOptions = [
    'browserCache',
    'cacheStorage',
    'cookies',
    'fileSystems',
    'indexedDB',
    'localStorage',
    'serviceWorkers',
    'webSQL'
  ];
  const metaOptions = ['emptyAllCache'];
  const allOptions = [...deletionOptions, ...metaOptions];
  
  const options = await chrome.storage.local.get(allOptions);
  
  // Set checkbox states based on stored options
  allOptions.forEach(optionName => {
    const checkbox = document.getElementById(optionName);
    if (checkbox) {
      checkbox.checked = options[optionName] === true;
    }
  });

  // Handle cancel button
  document.getElementById('cancel-btn').addEventListener('click', () => {
    window.close();
  });

  // Handle confirm button
  document.getElementById('confirm-btn').addEventListener('click', async () => {
    // Collect the current form values
    const form = document.getElementById('options-form');
    const formData = new FormData(form);
    const selectedOptions = {};
    
    allOptions.forEach(optionName => {
      const value = formData.get(optionName);
      selectedOptions[optionName] = value === 'on';
    });
    
    // Send message to background script with the selected options
    await chrome.runtime.sendMessage({ 
      action: 'confirmClear', 
      origin,
      options: selectedOptions
    });
    window.close();
  });
})();
