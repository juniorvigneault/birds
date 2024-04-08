// import mediapipe detection stuff
import {
  ObjectDetector,
  ImageSegmenter,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

// mediapipe stuff
let objectDetector;
let runningMode = "VIDEO";
let habitusFont;
// store the results of the model
let results;
let isDetecting = false;
let birdImageCreated = false;
// let cutOutBirdImage;
let maskImage;
let birdIsSegmented = false;
// // imageSegmentation 
let imageSegmenter;
let labels = [];
let birdsDetected = [];
// let cutOutBirdImage;
let allBirdImages = [];
let detectedBirdHistory = []; // Array to store the history of detected birds

// video variable for footage 
let birdFootage = {
  videoFeed: undefined,
  videoElement: undefined,
  path: 'images/seagull.mov',
  isRunning: false,
  width: 640,
  height: 360
}

let birdIndex = 0;
let tagged = false;
let circleMask;
let circleMaskSize = 400;

let sketch = new p5(function (p5) {

  p5.preload = function () {
    habitusFont = p5.loadFont('assets/fonts/Habitus-Medium.otf')
  }
  p5.setup = async function () {
    // create a video element from the video footage for the canvas
    // let container = document.querySelector('#container');
    let canvas = p5.createCanvas(birdFootage.width, 900);
    canvas.parent('container');

    // create video footage
    birdFootage.videoFeed = p5.createVideo(birdFootage.path);
    // birdFootage.videoFeed.hide();
    // birdFootage.videoFeed.size(birdFootage.width, birdFootage.height);
    birdFootage.videoFeed.parent('container')
    birdFootage.videoFeed.play();
    birdFootage.videoFeed.loop();
    // access the html video element of the video
    birdFootage.videoElement = document.querySelector('video');

    await initializeObjectDetector();

    birdFootage.videoElement.muted = true;
    // start further to have more detections
    birdFootage.videoElement.currentTime = 50;

    // birdFootage.

    // birdFootage.p5VideoLayer = p5.createVideo(birdFootage.path);

    // initialize bird detection 
    // initialize bird segmentation

    // birdFootage.htmlVideoLayer.style.zIndex = '-1';
    circleMask = p5.createGraphics(circleMaskSize, circleMaskSize);
    isDetecting = true;
  }

  async function initializeObjectDetector() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
    );
    objectDetector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite`,
        delegate: "GPU"
      },
      scoreThreshold: 0.15,
      runningMode: 'VIDEO'
    });
  }
  // run video and detections and draw rectangles around birds
  p5.draw = function () {
    p5.frameRate(25);
    // p5.background(0);
    p5.background(255);
    // copy the video stream to the canvas and position it under it
    p5.push();
    p5.imageMode(p5.CENTER);
    p5.image(birdFootage.videoFeed, p5.width / 2, birdFootage.height / 2, birdFootage.width, birdFootage.height);
    p5.pop();
    // if the the model is initialized, run detection on video and draw rectangles around birds
    if (objectDetector && isDetecting) {
      // put the detections of the video in results
      results = objectDetector.detectForVideo(birdFootage.videoElement, p5.millis());

      birdsDetected = results.detections;
      console.log(birdsDetected)

      // draw a rect around each bird
      if (birdsDetected.length > 0) {
        createBirdImages();
        drawDetectedBirds();
      }
    }
  }

  function createBirdImages() {
    allBirdImages = []; // Reset the array
    birdsDetected = results.detections;
    for (let i = 0; i < birdsDetected.length; i++) {
      let birdImage = birdFootage.videoFeed.get(birdsDetected[i].boundingBox.originX, birdsDetected[i].boundingBox.originY, birdsDetected[i].boundingBox.width, birdsDetected[i].boundingBox.height);
      allBirdImages.push(birdImage);
    }
    birdImageCreated = true;
    displayScore();
  };

  function drawDetectedBirds() {
    if (birdImageCreated && allBirdImages.length > 0) {
      let lastIndex = allBirdImages.length - 1; // Get the index of the last bird
      let bird = allBirdImages[lastIndex];
      let box = birdsDetected[lastIndex].boundingBox;
      circleMask.fill(0, 0, 0, 255);
      circleMask.circle(circleMaskSize / 2, circleMaskSize / 2, circleMaskSize);
      lines(box, bird);
      bird.mask(circleMask);
      p5.imageMode(p5.CENTER);
      p5.image(bird, p5.width / 2, p5.height / 2 + circleMaskSize / 2, circleMaskSize, circleMaskSize);
    }
  }


  function lines(box) {
    p5.push();

    p5.stroke(0, 255, 0);
    p5.strokeWeight(1);
    p5.line((p5.width / 2) - circleMaskSize / 2, p5.height / 2 + circleMaskSize / 2, box.originX + box.width / 2, box.originY + box.height / 2)
    p5.line((p5.width / 2) + circleMaskSize / 2, p5.height / 2 + circleMaskSize / 2, box.originX + box.width / 2, box.originY + box.height / 2)
    // p5.stroke(237, 3, 3);
    // p5.strokeWeight(10)
    // p5.fill(0, 0, 0, 0);
    // p5.ellipse(p5.width / 2, p5.height / 2 + circleMaskSize / 2, circleMaskSize + 10, circleMaskSize + 10);

    // p5.stroke(0, 255, 0);
    // p5.strokeWeight(2)
    // p5.fill(0, 0, 0, 0);
    // p5.ellipse(p5.width / 2, p5.height / 2 + circleMaskSize / 2, circleMaskSize, circleMaskSize)

    // p5.ellipse(p5.width / 2, p5.height / 2 + circleMaskSize / 2.85, circleMaskSize, circleMaskSize)
    p5.pop();
  }

  function displayScore() {
    for (let i = 0; i < birdsDetected.length; i++) {
      p5.push();
      let box = birdsDetected[i].boundingBox;
      // p5.fill(255, 255, 255, 0)
      // p5.stroke(230, 0, 0)
      // p5.rect(box.originX, box.originY, box.width, box.height)
      // p5.fill(0)
      // p5.textFont(habitusFont)
      p5.text(Math.floor(birdsDetected[i].categories[0].score * 100) % 100, box.originX, box.originY);
      // p5.fill(0);
      // p5.ellipse(box.originX - 10, box.originY + 5, 5, 5)
      p5.pop();
    }
  }

}) // end of p5 sketch