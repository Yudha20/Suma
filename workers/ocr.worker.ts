self.onmessage = () => {
  self.postMessage({
    message: 'OCR worker is optional and not enabled in MVP; TextDetector path runs on main thread with timeout.'
  });
};

export {};
