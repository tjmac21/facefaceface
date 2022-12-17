'use strict';

import * as faceapi from '../build/dist/face-api.esm';

// Load models
(async () => {
  const model = await chrome.runtime.getURL(
    '/models/ssd_mobilenetv1_model-weights_manifest.json'
  );
  console.log(model);
  await faceapi.nets.ssdMobilenetv1.loadFromUri(model);
  console.log('YEEEEHAW');
})();

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

const detectFaces = async (canvas, ctx, img, cancelAnimation) => {
  const start = Date.now();
  console.log('Detecting faces');
  try {
    const detections = await faceapi.detectAllFaces(img);

    console.log('Detection done');
    cancelAnimation();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';

    // redraw image with black box
    ctx.drawImage(img, 0, 0);
    detections.forEach((det) => {
      // const wRatio = canvas.width / det.imageWidth;
      // const hRatio = canvas.height / det.imageHeight;
      // ctx.strokeRect(
      //   det.box.x * wRatio
      //   det.box.y * hRatio
      //   det.box.width * wRatio
      //   det.box.height * hRatio
      // );
      ctx.fillRect(det.box.x, det.box.y, det.box.width, det.box.height);
    });
    console.log('Drawing done');

    canvas[
      canvas.convertToBlob
        ? 'convertToBlob' // specs
        : 'toBlob' // current Firefox
    ](async (imgBlob) => {
      const base64Blob = await blobToBase64(imgBlob);

      img.parentNode.removeChild(canvas);
      img.src = base64Blob;
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
  img.crossOrigin = 'anonymous';
  img.parentNode.insertBefore(canvas, img.nextSibling);

  // Set the position and z-index of the canvas
  // canvas.style.position = 'absolute';
  // canvas.style.zIndex = '1';

  // Start the animation
  animate();

  detectFaces(canvas, ctx, img, () => cancelAnimationFrame(requestID));
};
// Listen for message
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'HMN_LOG') {
    console.log('Log: ', request.payload);
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
