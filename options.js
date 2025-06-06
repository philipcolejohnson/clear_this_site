(async function initOptions() {
  // Update keyboard shortcut key label based on operating system
  function isMacOS() {
    const userAgent = window.navigator.userAgent;
    return userAgent.indexOf('Mac') !== -1;
  }
  if (isMacOS()) {
    const keyboardShortcutElement = document.getElementById('keyboard-shortcut-key');
    if (keyboardShortcutElement) {
      keyboardShortcutElement.textContent = 'Option+R';
    }
  }

  const optionElements = Array.from(document.querySelectorAll('input'));
  const names = optionElements.map(o => o.name);
  const options = await chrome.storage.local.get(names);
  optionElements.forEach(optionElement => {
    const optionName = optionElement.name;
    switch (optionElement.type) {
      case 'checkbox':
        optionElement.checked = options[optionName] === true;
        break;
      case 'radio':
        optionElement.checked = options[optionName] === optionElement.value;
        break;
    }
  });

  const emptyCacheOption = document.getElementById('emptyAllCache');

  function setBrowserCacheDisabledState() {
    const isChecked = emptyCacheOption.checked;
    const browserCacheOption = document.getElementById('browserCache');
    const browserCacheOptionLabel = document.getElementById('browserCacheLabel');
    browserCacheOption.disabled = isChecked;
    browserCacheOptionLabel.classList.toggle('option-disabled', isChecked);
  }

  // set initial states
  setBrowserCacheDisabledState();
  
  // update when options change
  emptyCacheOption.addEventListener('change', async () => {
    setBrowserCacheDisabledState();
  });


  // set options listener
  const list = document.getElementById('option-list');
  list.addEventListener('click', async (e) => {
    if (e.target.tagName.toLowerCase() === 'input') {
      const formData = new FormData(list);
      const optionElements = Array.from(document.querySelectorAll('input'));
      const settings = {};

      optionElements.forEach(optionElement => {
        const optionName = optionElement.name;
        const value = formData.get(optionName);
        switch (optionElement.type) {
          case 'checkbox':
            settings[optionName] = value === 'on';
            break;
          case 'radio':
            settings[optionName] = value;
            break;
        }
      });

      await chrome.storage.local.set(settings);
      // also save these in sync so new installs will have the latest settings
      await chrome.storage.sync.clear();
      await chrome.storage.sync.set(settings);
    }
  });
})();
