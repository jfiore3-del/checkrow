// Open CheckRow in the side panel when the toolbar icon is clicked.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error('CheckRow: could not set side panel behavior', err));
