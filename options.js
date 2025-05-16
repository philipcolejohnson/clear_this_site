(async function initOptions() {
  const optionElements = Array.from(document.querySelectorAll('input'));
  const names = optionElements.map(o => o.name);
  const options = await chrome.storage.sync.get(names);
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


  // set options listener
  const list = document.getElementById('option-list');
  list.addEventListener('click', (e) => {
    if (e.target.tagName.toLowerCase() === 'input') {
      const formData = new FormData(list);
      const optionName = e.target.name;
      const value = formData.get(optionName);
      const setting = {};
      switch (e.target.type) {
        case 'checkbox':
          setting[optionName] = value === 'on';
          break;
        case 'radio':
          setting[optionName] = value;
          break;
      }
      chrome.storage.sync.set(setting);
    }
  });
})();
