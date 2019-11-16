(function initOptions() {
  const options = Array.from(document.querySelectorAll('input'));
  const ids = options.map(o => o.id);
  chrome.storage.sync.get(ids, results => {
    options.forEach(option => option.checked = results[option.id]);
  });


  // set options listener
  const list = document.getElementById('option-list');;
  list.addEventListener('click', (e) => {
    if (e.target.tagName.toUpperCase() === 'INPUT') {
      const setting = {};
      setting[e.target.id] = e.target.checked;
      chrome.storage.sync.set(setting);
    }
  });
})();