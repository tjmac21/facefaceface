'use strict';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

import * as faceapi from '../build/dist/face-api.esm';

let uria;
let inita;
// Load models
let worker;
(async () => {
  const model = await chrome.runtime.getURL(
    '/models/ssd_mobilenetv1_model-weights_manifest.json'
  );
  console.log(model);
  await faceapi.nets.ssdMobilenetv1.loadFromUri(model);
  console.log('YEEEEHAW');
  // try {
  //   const w = await chrome.runtime.getURL('/w/worker.js');
  //   console.log(w);
  //   worker = new Worker('/w/worker.js');
  //   // const worker = new Worker(w);
  //   console.log(worker);
  //   worker.postMessage('Hello, worker!');
  //   console.log('sent bitchh');
  // } catch (err) {
  //   console.log(err);
  // }
})();

const detectFaces = async (canvas, ctx, img, cancelAnimation) => {
  const start = Date.now();
  console.log('Detecting faces');
  try {
    const detections = await faceapi.detectAllFaces(img);
    cancelAnimation();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    detections.forEach((det) => {
      const wRatio = canvas.width / det.imageWidth;
      const hRatio = canvas.height / det.imageHeight;
      ctx.beginPath();
      ctx.fillRect(
        det.box.x * wRatio,
        det.box.y * hRatio,
        det.box.width * wRatio,
        det.box.height * hRatio
      );
    });
  } catch (err) {
    console.log(err);
  }
  console.log(`Done in ${Date.now() - start}ms`);
};
const doTheThing = (url, img) => {
  // Get the canvas element and its 2D context
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set the dimensions of the canvas to match the dimensions of the image
  canvas.width = img.width;
  canvas.height = img.height;

  // Set the line width and stroke style for the loading animation
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#333';
  // The ID of the animation frame request
  let requestID;
  // Set the starting angle for the loading animation
  let angle = 0;
  function animate() {
    // Start the animation loop
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the loading animation
    ctx.beginPath();
    ctx.arc(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 3,
      angle,
      angle + Math.PI * 0.4
    );
    ctx.stroke();

    // Update the starting angle for the next frame
    angle += Math.PI / 64;

    // Request the next frame of the animation
    requestID = requestAnimationFrame(animate);
  }

  // Insert the canvas element into the DOM, right after the image
  img.parentNode.insertBefore(canvas, img.nextSibling);

  // Set the position and z-index of the canvas
  canvas.style.position = 'absolute';
  canvas.style.zIndex = '1';

  // Start the animation
  animate();

  setTimeout(() => {
    detectFaces(canvas, ctx, img, () => cancelAnimationFrame(requestID));
  }, 5000);
};
// Listen for message
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'COUNT') {
    console.log(`Current count is ${request.payload.count}`);
  } else if (request.type === 'BOOMER') {
    console.log(`Cust`, request.payload);
    uria = request.payload.url;
    inita = request.payload.init;
  } else if (request.type === 'FETCH') {
    console.log(request.payload);
    const res = await fetch(request.payload.url, request.payload.init);
    console.log(res);
    const buildResp = {
      str: JSON.stringify({
        body: res.body,
        bodyUsed: res.bodyUsed,
        headers: res.headers,
        ok: res.ok,
        redirected: res.redirected,
        status: res.status,
        statusText: res.statusText,
        type: res.type,
        url: res.url,
      }),
      jsonBlob: JSON.stringify(await res.json()),
    };
    console.log(buildResp);
    sendResponse(buildResp);
    return true;
  } else if (request.type === 'HMN_LOG') {
    console.log('Log: ', request.payload);
    // hideLoader();
  } else if (request.type === 'BOOMERANGA') {
    console.log('Log: ', request.payload);
    // Get the first image with the src
    const img = document.querySelector(`img[src="${request.payload.url}"]`);
    console.log(img);

    if (!img) {
      const all = document.getElementsByTagName('img');
      console.log(all);
      [...all].forEach((im) => {
        console.log(
          im.currentSrc == request.payload.url,
          im.currentSrc,
          request.payload.url
        );
        if (im.currentSrc == request.payload.url) {
          console.log('WINNER!!!', im);
          im.setAttribute('data-totallygonnablockyourface', 'YES');
        }
      });
    }
    // Check if the image was found
    if (img) {
      console.log('WINNER!!!', img);
      img.setAttribute('data-totallygonnablockyourface', 'YES');
    }
  } else if (request.type === 'BOOMERANG') {
    console.log('BOOM: ', request.payload);

    // Get the first image with the src
    const img = document.querySelector(`img[src="${request.payload.url}"]`);
    console.log(img);

    if (!img) {
      const all = document.getElementsByTagName('img');
      console.log(all);
      [...all].forEach((im) => {
        console.log(
          im.currentSrc == request.payload.url,
          im.currentSrc,
          request.payload.url
        );
        if (im.currentSrc == request.payload.url) {
          console.log('WINNER!!!', im);
          doTheThing(request.payload.url, im);
        }
      });
    }
    // Check if the image was found
    if (img) {
      doTheThing(request.payload.url, img);
    }
  } else {
    console.log('yoooo', { request });
  }

  // Send an empty response
  // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
  sendResponse({});
  return true;
});
