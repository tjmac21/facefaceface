import * as faceapi from '../build/dist/face-api.esm';

let worker;
(async () => {
  const model = await chrome.runtime.getURL(
    '/models/ssd_mobilenetv1_model-weights_manifest.json'
  );
  console.log(model);
  await faceapi.nets.ssdMobilenetv1.loadFromUri(model);
  console.log('YEEEEHAW');
  try {
    const w = await chrome.runtime.getURL('/w/worker.js');
    console.log(w);
    worker = new Worker('/w/worker.js');
    // const worker = new Worker(w);
    console.log(worker);
    worker.postMessage('Hello, worker!');
    console.log('sent bitchh');
  } catch (err) {
    console.log(err);
  }
})();
(async () => {
  // const oldIframe = document.getElementById('cm-frame');

  // if (oldIframe) {
  //   oldIframe.remove();
  //   return;
  // }

  // const iframe = document.createElement('iframe');
  // iframe.setAttribute('id', 'cm-frame');
  // iframe.setAttribute(
  //   'style',
  //   'top: 10px;right: 10px;width: 400px;height: calc(100% - 20px);z-index: 2147483650;border: none; position:fixed;'
  // );
  // iframe.setAttribute('allow', '');
  // iframe.src = chrome.runtime.getURL('popup.html');

  // document.body.appendChild(iframe);

  const model = await chrome.runtime.getURL(
    '/models/ssd_mobilenetv1_model-weights_manifest.json'
  );
  console.log(model);
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromUri(model);
  } catch (err) {
    console.log(err);
  }
  console.log('yeee');

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
    console.log('dothe thing');
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
  const imag = document.querySelector('[data-totallygonnablockyourface="YES"]');
  if (!imag) {
    console.log('none');
    return;
  }
  imag.setAttribute('data-totallygonnablockyourface', 'no');
  const url = imag.currentSrc;
  console.log('yeee', url);
  // Get the first image with the src
  const img = document.querySelector(`img[src="${url}"]`);
  console.log(img);

  if (!img) {
    const all = document.getElementsByTagName('img');
    console.log(all);
    [...all].forEach((im) => {
      console.log(im.currentSrc == url, im.currentSrc, url);
      if (im.currentSrc == url) {
        console.log('WINNER!!!', im);
        doTheThing(url, im);
      }
    });
  }
  // Check if the image was found
  if (img) {
    doTheThing(url, img);
  }
})();
