// import * as faceapi from '../build/dist/face-api.esm';

console.log('im alive');
// (async () => {
//   const faceapi = require('../build/dist/face-api.esm');
//   const model = await chrome.runtime.getURL(
//     '/models/ssd_mobilenetv1_model-weights_manifest.json'
//   );
//   console.log(model);
//   await faceapi.nets.ssdMobilenetv1.loadFromUri(model);
//   console.log('LOADED');
// })();
// Log any messages received from the web worker
self.onmessage = (event) => {
  console.log(event);
};

Worker.onmessage = (event) => {
  console.log(event);
};

// worker.onmessage = (event) => {
//   console.log(event);
// };
