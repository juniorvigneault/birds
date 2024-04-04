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

// video variable for footage 
let birdFootage = {
  p5VideoLayer: undefined,
  htmlVideoLayer: undefined,
  path: 'images/birds2.mp4',
  isRunning: false,
  width: 640,
  height: 360
}

let sketch = new p5(function (p5) {

  p5.preload = function () {
    habitusFont = p5.loadFont('assets/fonts/Habitus-Medium.otf')
  }
  p5.setup = async function () {
    // create a video element from the video footage for the canvas
    birdFootage.p5VideoLayer = p5.createVideo(birdFootage.path);
    p5.createCanvas(birdFootage.width, birdFootage.height);
    // initialize bird detection 
    await initializeObjectDetector();
    // initialize bird segmentation
    await createImageSegmenter();
    birdFootage.p5VideoLayer.loop();
    isDetecting = true;

  }
  // run video and detections and draw rectangles around birds
  p5.draw = function () {
    p5.background(0);
    // copy the video stream to the canvas and position it under it
    birdFootage.htmlVideoLayer = document.querySelector('video');
    birdFootage.htmlVideoLayer.muted = true;
    birdFootage.htmlVideoLayer.style.position = 'fixed';
    birdFootage.htmlVideoLayer.style.top = '0px';
    birdFootage.htmlVideoLayer.style.zIndex = '-1';

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
      }
    }

    if (birdImageCreated) {
      // p5.image(cutOutBirdImage, 0, 0);
    }

    // Display the new p5 Image object
    if (birdIsSegmented) {
      // resultBox(p5.width / 2, p5.height / 2, maskImage.width + 20, maskImage.height + 20);

    }
  }

  // when clicking the canvas, play video in a loop
  p5.mousePressed = function () {}
  p5.mouseReleased = function () {
    // isDetecting = false;
  }

  p5.keyPressed = function () {
    if (isDetecting && p5.keyCode === 83) {
      // pause the footage video loop
      birdFootage.p5VideoLayer.pause();
      // create an image with the first bird in the array
      createBirdImage();
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
      scoreThreshold: 0.5,
      runningMode: 'VIDEO'
    });
  }

  async function createImageSegmenter() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "sharedModels/1.tflite",
        //"sharedModels/1.tflite"
      },
      outputCategoryMask: true,
      outputConfidenceMasks: false,
      runningMode: 'IMAGE'
    });

    imageSegmenter.getLabels();
  };

  function segmentBirdImage() {
    if (birdImageCreated) {
      // imageSegmenter.segment(cutOutBirdImage.canvas, handleSegmentationResults);

    }
  }

  function handleSegmentationResults(result) {
    const {
      width,
      height
    } = result.categoryMask;

    // Create a new p5.js image for the mask
    maskImage = p5.createImage(width, height);
    maskImage.loadPixels();

    // Access the pixel data from the segmentation mask
    let imageData = result.categoryMask.containers[0]; // Assuming only one container

    // Access the pixel data from the original image
    cutOutBirdImage.loadPixels();

    // Iterate through the pixel data and set the mask image pixels
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        let index = i * width + j; // Calculate the index in the 1D array
        let value = imageData[index]; // Get the pixel value

        // Set the pixel color based on the segmentation mask value
        if (value > 0) {
          // Copy the color from the original image
          let colorIndex = (i * width + j) * 4; // Calculate the color index in the 1D array
          let r = cutOutBirdImage.pixels[colorIndex];
          let g = cutOutBirdImage.pixels[colorIndex + 1];
          let b = cutOutBirdImage.pixels[colorIndex + 2];
          let a = cutOutBirdImage.pixels[colorIndex + 3];
          maskImage.set(j, i, p5.color(r, g, b, a)); // Set the color with alpha channel
        } else {
          // Set transparent pixel
          maskImage.set(j, i, p5.color(0, 0, 0, 0));
        }
      }
    }


    // Update the pixels of the mask image
    maskImage.updatePixels();
    birdIsSegmented = true;

    // You can now use the maskImage for further processing or visualization
  }

  function createBirdImages() {
    allBirdImages = []; // Reset the array
    birdsDetected = results.detections;

    for (let i = 0; i < birdsDetected.length; i++) {
      let birdImage = birdFootage.p5VideoLayer.get(birdsDetected[i].boundingBox.originX, birdsDetected[i].boundingBox.originY, birdsDetected[i].boundingBox.width, birdsDetected[i].boundingBox.height);
      allBirdImages.push(birdImage);
    }


    birdImageCreated = true;

    // console.log(birdsDetected.length, allBirdImages.length)
    // segmentBirdImage();
  };

  function resultBox(x, y, w, h) {
    p5.push();
    p5.rectMode(p5.CENTER);
    p5.fill(255);
    // p5.noStroke();
    p5.stroke(0.5);
    p5.rect(x, y, w, h);
    p5.pop();

    p5.push();
    p5.imageMode(p5.CENTER);
    p5.image(maskImage, x, y);
    p5.pop();
  }

}) // end of p5 sketch
let sketch2 = new p5(function (p5) {
  let trailFrames = []; // Array to store previous frames for the trail effect
  let maxTrailFrames = 200; // Maximum number of frames to keep in the trail

  p5.setup = function () {
    p5.createCanvas(birdFootage.width, birdFootage.height);
  };

  p5.draw = function () {
    p5.background(237, 3, 3);
    if (birdImageCreated) {
      if (birdsDetected.length > 0) {
        p5.imageMode(p5.CORNER);

        drawDetectedBirds();
      }
    }

    // Draw the trail frames even if there are no detections
    drawTrailFrames();
  }

  function drawDetectedBirds() {
    if (birdImageCreated) {
      for (let i = 0; i < allBirdImages.length; i++) {
        let bird = allBirdImages[i];
        let box = birdsDetected[i].boundingBox;

        // Draw the current frame of detected birds on the main canvas
        p5.image(bird, box.originX, box.originY, box.width, box.height);

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
      p5.image(frame.birdImage, frame.box.originX, frame.box.originY, frame.box.width, frame.box.height);
    }
  }
});