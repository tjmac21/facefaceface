'use strict';

const sendPayload = (type, payload) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {
      type,
      payload,
    });
  });
};

const CONTEXT_MENU_ID = 'facefaceface';
chrome.contextMenus.create({
  title: 'BLOCK DAT ISH',
  contexts: ['image'],
  id: CONTEXT_MENU_ID,
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID) {
    // Handle click event here
    sendPayload('BOOMERANG', { url: info.srcUrl });
  }
});
