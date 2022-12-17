'use strict';

// import * as H from './dist/human';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

// use face-api instead!
import * as faceapi from '../build/dist/face-api.esm';
import { Canvas, Image, ImageData } from 'canvas';

const sendPayload = (type, payload) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {
      type,
      payload,
    });
  });
};
const fetcher = async (url, init) => {
  const res = await fetch(url, init);
  const opts = {
    body: res.body,
    bodyUsed: res.bodyUsed,
    headers: res.headers,
    ok: res.ok,
    redirected: res.redirected,
    status: res.status,
    statusText: res.statusText,
    type: res.type,
    url: res.url,
  };
  const bytes = new TextEncoder().encode(JSON.stringify(await res.json()));
  const blob = new Blob([bytes], {
    type: 'application/json;charset=utf-8',
  });
  console.log(opts, blob);
  return new Response(blob, opts);
};
let tab;
const fetcherWrapper = (url, init, tab) =>
  new Promise((resolve, reject) => {
    console.log('bg', url, init, tab);
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: async () => {
          console.log('csp');
          console.log(uria, inita);
          const res = await fetch(uria, inita);
          const opts = {
            body: res.body,
            bodyUsed: res.bodyUsed,
            headers: res.headers,
            ok: res.ok,
            redirected: res.redirected,
            status: res.status,
            statusText: res.statusText,
            type: res.type,
            url: res.url,
          };
          const bytes = new TextEncoder().encode(
            JSON.stringify(await res.json())
          );
          const blob = new Blob([bytes], {
            type: 'application/json;charset=utf-8',
          });
          console.log(opts, blob);
          return new Response(blob, opts);
        },
      },
      (injectionResults) => {
        resolve(injectionResults);
      }
    );
  });

const humanStorage = {
  get: () => chrome.storage.local.get(['human']),
  set: (human) => chrome.storage.local.set({ human }),
};

const initHuman = async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('../build/models');
};

const findFace = async (url, tab) => {
  try {
    const t = await chrome.runtime.getURL(
      '/models/ssd_mobilenetv1_model-weights_manifest.json'
    );
    // const test = await fetcher(t);
    // const opts = {
    //   body: test.body,
    //   bodyUsed: test.bodyUsed,
    //   headers: test.headers,
    //   ok: test.ok,
    //   redirected: test.redirected,
    //   status: test.status,
    //   statusText: test.statusText,
    //   type: test.type,
    //   url: test.url,
    // };
    // const bytes = new TextEncoder().encode(JSON.stringify(await test.json()));
    // const blob = new Blob([bytes], {
    //   type: 'application/json;charset=utf-8',
    // });

    faceapi.env.monkeyPatch({
      Canvas, //new OffscreenCanvas(width, height)
      Image,
      ImageData,
      // readFile: () => Promise.resolve(bufferFrom(JSON.stringify(weightedMap))),
      fetch: async (u, i) => {
        try {
          sendPayload('BOOMER', { url: u, init: i });
          // await fetcher(u, i);
          await setTimeout(async () => await fetcherWrapper(u, i, tab), 1000);
        } catch (err) {
          console.log('uhoh', err);
        }
      },
    });
    // console.log(test);
    // sendPayload('HMN_LOG', `COCO${test.status}`);
    // sendPayload('HMN_LOG', `cc${JSON.stringify(await test.json())}`);
    // ***** FETCH WORKS ABOVE SO THEN WHY NO WORK FROM loadFromUri()?????
    await faceapi.nets.ssdMobilenetv1.loadFromUri(t);
    console.log('oy!');
    sendPayload('HMN_LOG', 'IT WORKS!!!');
    sendPayload('HMN_LOG', '2');
    const input = new Image();
    input.src = url;
    sendPayload('HMN_LOG', '2.5');
    const detections = await faceapi.detectSingleFace(input);
    sendPayload('HMN_LOG', '3');
  } catch (err) {
    console.log(err);
    // sendPayload('HMN_LOG', `err: ${err.message}, ${err.stack}`);
  }
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'GREETINGS') {
    const message = `Hi ${
      sender.tab ? 'Con' : 'Pop'
    }, my name is Bac. I am from Background. It's great to hear from you.`;

    // Log message coming from the `request` parameter
    console.log(request.payload.message);
    // Send a response message
    sendResponse({
      message,
    });
    // await initHuman();
  } else if (request.type === 'INIT') {
    const message = `INIIIIIIT`;

    // Send a response message
    sendResponse({
      message,
    });
  } else {
    console.log('huuuuhh');
  }
});

const CONTEXT_MENU_ID = 'testset';
chrome.contextMenus.create({
  title: 'BLOCK DAT ISH',
  contexts: ['image'],
  id: CONTEXT_MENU_ID,
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID) {
    // Handle click event here
    sendPayload('BOOMERANGA', { url: info.srcUrl });
    // sendPayload('BOOMER', { tab });
    // findFace(info.srcUrl, tab);
    // tab = tab;

    // setTimeout(() => {
    //   console.log('go~!');
    //   chrome.scripting.executeScript({
    //     target: { tabId: tab.id },
    //     files: ['tricky.js'],
    //   });
    // }, 1000);
  }
});

// chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//   const activeTab = tabs[0];
//   chrome.tabs.sendMessage(
//     activeTab.id,
//     {
//       type: 'SRC',
//       payload: {
//         url,
//       },
//     },
//     function (response) {
//       console.log('Received response from content script: ', response);
//     }
//   );
// });

// const fetcher = (url, init) =>
//   new Promise((resolve, reject) => {
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//       const activeTab = tabs[0];
//       chrome.tabs.sendMessage(
//         activeTab.id,
//         {
//           type: 'FETCH',
//           payload: {
//             url,
//             init,
//           },
//         },
//         function (response) {
//           console.log('Received response from content script: ', response);
//           // const json = JSON.parse(response.str);
//           // const bytes = new TextEncoder().encode(response.jsonBlob);
//           // const blob = new Blob([bytes], {
//           //   type: 'application/json;charset=utf-8',
//           // });
//           // console.log(json, blob);
//           // resolve(new Response(blob, json));
//         }
//       );
//     });
//   });
