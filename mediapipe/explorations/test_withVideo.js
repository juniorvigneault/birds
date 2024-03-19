// import mediapipe detection stuff
import {
  ObjectDetector,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

// mediapipe stuff
let objectDetector;
let runningMode = "VIDEO";
// store the results of the model
let results;

// video variable for footage 
let birdFootage = {
  p5VideoLayer: undefined,
  htmlVideoLayer: undefined,
  path: 'images/seagull.mov',
  isRunning: false,
  width: 640,
  height: 360
}

let sketch = new p5(function (p5) {
  p5.setup = async function () {
    // create a video element from the video footage for the canvas
    birdFootage.p5VideoLayer = p5.createVideo(birdFootage.path);
    p5.createCanvas(birdFootage.width, birdFootage.height);


    // Initialize the object detector
    const initializeObjectDetector = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
      );
      // load model
      objectDetector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
          delegate: "GPU"
        },
        scoreThreshold: 0.5,
        runningMode: runningMode
      });
    };

    await initializeObjectDetector();

  }
  // run video and detections and draw rectangles around birds
  p5.draw = function () {
    p5.background(0);
    // copy the video stream to the canvas and position it under it
    birdFootage.htmlVideoLayer = document.querySelector('video');
    birdFootage.htmlVideoLayer.style.position = 'fixed';
    birdFootage.htmlVideoLayer.style.top = '0px'
    birdFootage.htmlVideoLayer.style.zIndex = '-1'

    p5.push();
    p5.image(birdFootage.p5VideoLayer, 0, 0, birdFootage.width, birdFootage.height);
    p5.pop();
    // if the the model is initialized, run detection on video and draw rectangles around birds
    if (objectDetector) {
      // put the detections of the video in results
      results = objectDetector.detectForVideo(birdFootage.htmlVideoLayer, p5.millis());
      let birdsDetected = results.detections;
      // draw a rect around each bird
      for (let i = 0; i < birdsDetected.length; i++) {
        p5.push();
        let box = birdsDetected[i].boundingBox;
        p5.fill(255, 255, 255, 20)
        p5.rect(box.originX, box.originY, box.width, box.height)
        p5.pop();
      }
    }
  }
  // when clicking the canvas, play video in a loop
  p5.mousePressed = function () {
    // loop placeholder bird video
    birdFootage.p5VideoLayer.loop();
  }
})