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

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

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

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.message == 'convert_image_url_to_blob') {
    var canvas = new OffscreenCanvas(request.width, request.height);
    const iblob = await fetch(request.url).then((r) => r.blob());
    const img = await createImageBitmap(iblob);
    canvas.getContext('2d').drawImage(img, 0, 0);

    request.boxes.forEach((box) =>
      canvas.getContext('2d').fillRect(box.x, box.y, box.width, box.height)
    );
    if (canvas.convertToBlob !== undefined) {
      const imgBlob = await canvas.convertToBlob();
      console.log('wtf');
      const base64Blob = await blobToBase64(imgBlob);
      console.log(imgBlob);

      sendPayload('REPLACE', { base64Blob });
    }
  }
});
