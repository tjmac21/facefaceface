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

  // const img = await chrome.runtime.getURL('/images/faces.jpeg');
  // await detectFaces(img);
  // console.log(primes)
})();

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

class Tester extends OffscreenCanvas {
  constructor() {
    super(1000, 1000);
  }
}

const detectFaces = async (img) => {
  console.log('Detecting faces');
  try {
    faceapi.env.monkeyPatch({
      Canvas: Tester,
    });
    const detections = await faceapi.detectAllFaces(img);
    return detections;
  } catch (err) {
    console.log(err);
  }
  return null;
};

const prepareCanvas = (img) => {
  // Get the canvas element and its 2D context
  const canvas = document.createElement('canvas');
  canvas.id = 'BOOMSHAKALAKA';
  const ctx = canvas.getContext('2d');

  // Set the dimensions of the canvas to match the dimensions of the image
  canvas.width = img.width;
  canvas.height = img.height;

  // Insert the canvas element into the DOM, right after the image
  img.setAttribute('cross-origin', 'anonymous');
  img.parentNode.insertBefore(canvas, img.nextSibling);

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

  // Start the animation
  animate();

  return {
    canvas: canvas,
    cancelAnimation: () => cancelAnimationFrame(requestID),
  };
};

const drawOnCanvas = async (boxes, img, c) => {
  const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d');
  // console.log(ctx);
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  // canvas.width = img.naturalWidth;
  // canvas.height = img.naturalHeight;
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'black';
  ctx.fillStyle = 'black';

  // redraw image with black box
  ctx.drawImage(img, 0, 0);
  boxes.forEach((det) => {
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

  if (canvas.toBlob !== undefined) {
    canvas.toBlob(async (imgBlob) => {
      console.log('wtf');
      const base64Blob = await blobToBase64(imgBlob);
      console.log(imgBlob);
      img.parentNode.removeChild(canvas);

      img.src = base64Blob;
    });
  }
  if (canvas.convertToBlob !== undefined) {
    const imgBlob = await canvas.convertToBlob();
    console.log('wtf');
    const base64Blob = await blobToBase64(imgBlob);
    console.log(imgBlob);

    img.src = base64Blob;
  }
};

const doHalfInClient = async (img) => {
  const start = Date.now();
  try {
    const { canvas, cancelAnimation } = prepareCanvas(img);

    // Insert the canvas element into the DOM, right after the image
    img.setAttribute('cross-origin', 'anonymous');
    img.parentNode.insertBefore(canvas, img.nextSibling);

    const boxes = await detectFaces(img);

    chrome.runtime.sendMessage({
      action: 'getImg',
      canvasId: 'BOOMSHAKALAKA',
      boxes,
      dimensions: {
        height: img.naturalHeight,
        width: img.naturalWidth,
      },
    });

    cancelAnimation();

    // drawOnCanvas(boxes, img, canvas);
  } catch (err) {
    console.log(err);
  }
  console.log(`Done in ${Date.now() - start}ms`);
};

const doAllInClient = async (img, url) => {
  const start = Date.now();
  try {
    // const { canvas, cancelAnimation } = prepareCanvas(img);

    const boxes = await detectFaces(img);

    // cancelAnimation();

    img.classList.add('EXTREMELY_FACE');
    chrome.runtime.sendMessage({
      message: 'convert_image_url_to_blob',
      url: url,
      height: img.naturalHeight,
      width: img.naturalWidth,
      boxes: boxes.map((det) => ({
        x: det.box.x,
        y: det.box.y,
        width: det.box.width,
        height: det.box.height,
      })),
    });
    // drawOnCanvas(boxes, img, null);
    // img.parentNode.removeChild(canvas);
  } catch (err) {
    console.log(err);
  }
  console.log(`Done in ${Date.now() - start}ms`);
};

// Listen for message
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'HMN_LOG') {
    console.log('Log: ', request.payload);
  } else if (request.type === 'REPLACE') {
    console.log('replace: ', request.payload);
    const imgs = document.getElementsByClassName('EXTREMELY_FACE');
    if (imgs.length === 1 && request.payload.base64Blob) {
      imgs[0].src = request.payload.base64Blob;
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
          // doHalfInClient(im);
          doAllInClient(im, request.payload.url);
        }
      });
    }
    // Check if the image was found
    if (img) {
      // doHalfInClient(img);
      doAllInClient(img, request.payload.url);
    }
  } else {
    console.log('yoooo', { request });
  }

  // Send an empty response
  // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
  sendResponse({});
  return true;
});

// plan is to spawn a service worker and do the drawing there via this: https://stackoverflow.com/a/19896047
// this is great since it also unblocks the main thread
// additionally I want to try using puire css loaders like this: https://cssloaders.github.io/
// another issue to solve is the problem if its not an img tag
// another issue to solve it the problem if the img tag cant be right-clicked because its behind another element
