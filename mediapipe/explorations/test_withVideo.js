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
let trailFrames = []; // Array to store previous frames for the trail effect
let maxTrailFrames = 400; // Maximum number of frames to keep in the trail
// video variable for footage 
let birdFootage = {
  p5VideoLayer: undefined,
  htmlVideoLayer: undefined,
  path: 'images/birds2.mp4',
  isRunning: false,
  width: 640,
  height: 360,
  margin: 10
}

let sketch = new p5(function (p5) {

  p5.preload = function () {
    habitusFont = p5.loadFont('assets/fonts/Habitus-Medium.otf')
  }
  p5.setup = async function () {
    // create a video element from the video footage for the canvas
    birdFootage.p5VideoLayer = p5.createVideo(birdFootage.path);
    p5.createCanvas(birdFootage.width, (birdFootage.height * 2) + birdFootage.margin);
    // initialize bird detection 
    await initializeObjectDetector();
    // initialize bird segmentation
    birdFootage.p5VideoLayer.loop();
    isDetecting = true;
    birdFootage.htmlVideoLayer = document.querySelector('video');
    birdFootage.htmlVideoLayer.muted = true;

  }
  // run video and detections and draw rectangles around birds
  p5.draw = function () {
    p5.frameRate(25)
    p5.background(237, 3, 3);
    // p5.background(0);
    // copy the video stream to the canvas and position it under it
    p5.push();
    p5.image(birdFootage.p5VideoLayer, 0, 0, birdFootage.width, birdFootage.height);
    p5.pop();
    // if the the model is initialized, run detection on video and draw rectangles around birds
    if (objectDetector && isDetecting) {
      // put the detections of the video in results
      results = objectDetector.detectForVideo(birdFootage.htmlVideoLayer, p5.millis());

      birdsDetected = results.detections;
      // console.log(birdsDetected.categories)
      // draw a rect around each bird
      if (birdsDetected.length > 0) {
        for (let i = 0; i < birdsDetected.length; i++) {
          p5.push();
          let box = birdsDetected[i].boundingBox;
          // p5.fill(255, 255, 255, 0)
          // p5.stroke(230, 0, 0)
          // p5.rect(box.originX, box.originY, box.width, box.height)
          p5.fill(0)
          p5.textFont(habitusFont)
          p5.text(Math.floor(birdsDetected[i].categories[0].score * 100) % 100, box.originX, box.originY);
          p5.fill(0);
          p5.ellipse(box.originX - 10, box.originY + 5, 5, 5)
          p5.pop();
        }
        createBirdImages();

        drawDetectedBirds();

        // Draw the trail frames even if there are no detections
        drawTrailFrames();
      }
    }
  }


  async function initializeObjectDetector() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
    );
    objectDetector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
        delegate: "GPU"
      },
      scoreThreshold: 0.15,
      runningMode: 'VIDEO'
    });
  }


  function createBirdImages() {
    allBirdImages = []; // Reset the array
    birdsDetected = results.detections;
    for (let i = 0; i < birdsDetected.length; i++) {
      let birdImage = birdFootage.p5VideoLayer.get(birdsDetected[i].boundingBox.originX, birdsDetected[i].boundingBox.originY, birdsDetected[i].boundingBox.width, birdsDetected[i].boundingBox.height);
      allBirdImages.push(birdImage);
    }
    birdImageCreated = true;
  };

  function drawDetectedBirds() {
    if (birdImageCreated) {
      for (let i = 0; i < allBirdImages.length; i++) {
        let bird = allBirdImages[i];
        let box = birdsDetected[i].boundingBox;

        // Draw the current frame of detected birds on the main canvas
        p5.image(bird, box.originX, box.originY + birdFootage.height + birdFootage.margin, box.width, box.height);

        // Save the current frame in the trailFrames array
        trailFrames.push({
          birdImage: bird,
          box: box
        });

        // Limit the number of frames in the trailFrames array
        if (trailFrames.length > maxTrailFrames) {
          trailFrames.shift(); // Remove the oldest frame if the array exceeds the maximum number of frames
        }
      }
    }
  }

  function drawTrailFrames() {
    // Draw the trail frames
    for (let i = 0; i < trailFrames.length; i++) {
      let frame = trailFrames[i];
      p5.image(frame.birdImage, frame.box.originX, frame.box.originY + birdFootage.height + birdFootage.margin, frame.box.width, frame.box.height);
    }
  }
}) // end of p5 sketch