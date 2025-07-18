// import mediapipe detection stuff
import {
  ObjectDetector,
  ImageSegmenter,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

// mediapipe stuff
let objectDetector;
let runningMode = "VIDEO";
let habitusFont;
// store the results of the model
let previousDetections = []; // Store previous frame detections
let maxPreviousFrames = 10; // How many previous frames to keep
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
let maxTrailFrames = 300; // Maximum number of frames to keep in the trail
// video variable for footage
let birdFootage = {
  p5VideoLayer: undefined,
  htmlVideoLayer: undefined,
  path: "assets/videos/birds_1.mp4",
  isRunning: false,
  width: 1024,
  height: 576,
  margin: 10,
};
let mapMSL;
let sketch = new p5(function (p5) {
  p5.preload = function () {
    habitusFont = p5.loadFont("assets/fonts/Habitus-Medium.otf");
    mapMSL = p5.loadImage("assets/map_MSL.png");
  };
  p5.setup = async function () {
    // create a video element from the video footage for the canvas
    birdFootage.p5VideoLayer = p5.createVideo(birdFootage.path);
    p5.createCanvas(birdFootage.width, birdFootage.height);
    // initialize bird detection
    await initializeObjectDetector();
    // initialize bird segmentation
    birdFootage.p5VideoLayer.loop();
    isDetecting = true;
    birdFootage.htmlVideoLayer = document.querySelector("video");
    birdFootage.htmlVideoLayer.muted = true;
  };
  // run video and detections and draw rectangles around birds
  p5.draw = function () {
    // p5.frameRate(25);
    p5.background(255);

    // if the the model is initialized, run detection on video and draw rectangles around birds
    if (objectDetector && isDetecting) {
      // put the detections of the video in results
      results = objectDetector.detectForVideo(
        birdFootage.htmlVideoLayer,
        p5.millis()
      );

      birdsDetected = results.detections;
      // console.log(birdsDetected.categories)
      // draw a rect around each bird
      // if (birdsDetected.length > 0) {
      for (let i = 0; i < birdsDetected.length; i++) {
        // p5.push();
        // let box = birdsDetected[i].boundingBox;
        // p5.fill(255, 255, 255, 0);
        // p5.stroke(230, 0, 0);
        // p5.rect(box.originX, box.originY, box.width, box.height);
        // p5.fill(0);
        // p5.textFont(habitusFont);
        // p5.text(
        //   Math.floor(birdsDetected[i].categories[0].score * 100) % 100,
        //   box.originX,
        //   box.originY
        // );
        // p5.fill(0);
        // p5.ellipse(box.originX - 10, box.originY + 5, 5, 5);
        // p5.pop();
      }
      // p5.image(birdFootage.p5VideoLayer, 0, 0);

      createBirdImages();

      drawDetectedBirds();

      // Draw the trail frames even if there are no detections
      // drawTrailFrames();
      // }
    }
    // p5.push();
    // p5.blendMode(p5.DARKEST);
    // p5.image(mapMSL, 0, 0);
    // p5.pop();
  }; // end of draw

  async function initializeObjectDetector() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
    );
    objectDetector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
        delegate: "GPU",
      },
      scoreThreshold: 0.1,
      runningMode: "VIDEO",
    });
  }

  function createBirdImages() {
    allBirdImages = []; // Reset the array
    birdsDetected = results.detections;
    for (let i = 0; i < birdsDetected.length; i++) {
      let birdImage = birdFootage.p5VideoLayer.get(
        birdsDetected[i].boundingBox.originX,
        birdsDetected[i].boundingBox.originY,
        birdsDetected[i].boundingBox.width,
        birdsDetected[i].boundingBox.height
      );
      allBirdImages.push(birdImage);
    }
    birdImageCreated = true;
  }

  function drawDetectedBirds() {
    if (birdImageCreated) {
      // Draw current detections
      for (let i = 0; i < allBirdImages.length; i++) {
        let bird = allBirdImages[i];
        let box = birdsDetected[i].boundingBox;

        // Draw the current frame of detected birds on the main canvas
        p5.image(bird, box.originX, box.originY, box.width, box.height);

        // Save the current frame in the trailFrames array
        trailFrames.push({
          birdImage: bird,
          box: box,
        });

        // Limit the number of frames in the trailFrames array
        if (trailFrames.length > maxTrailFrames) {
          trailFrames.shift(); // Remove the oldest frame if the array exceeds the maximum number of frames
        }
      }

      // Draw connecting lines between different birds in the same frame
      drawBirdConnectionLines();
    }
  }
  function drawBirdConnectionLines() {
    let maxConnectionsPerBird = 2; // You can make this adjustable via UI too

    p5.push();
    p5.stroke(255, 0, 0, 150); // Red lines with transparency
    p5.strokeWeight(2);

    for (let i = 0; i < birdsDetected.length; i++) {
      let currentBox = birdsDetected[i].boundingBox;
      let currentCenter = {
        x: currentBox.originX + currentBox.width / 2,
        y: currentBox.originY + currentBox.height / 2,
      };

      // Calculate distances to all other birds
      let distances = [];

      for (let j = 0; j < birdsDetected.length; j++) {
        if (i !== j) {
          let otherBox = birdsDetected[j].boundingBox;
          let otherCenter = {
            x: otherBox.originX + otherBox.width / 2,
            y: otherBox.originY + otherBox.height / 2,
          };

          let dx = currentCenter.x - otherCenter.x;
          let dy = currentCenter.y - otherCenter.y;
          let distSq = dx * dx + dy * dy;

          distances.push({
            index: j,
            distSq: distSq,
            otherCenter: otherCenter,
          });
        }
      }

      // Sort by distance and take the closest N
      distances.sort((a, b) => a.distSq - b.distSq);
      let connections = distances.slice(0, maxConnectionsPerBird);

      // Draw lines to selected connections
      for (let k = 0; k < connections.length; k++) {
        let target = connections[k];
        p5.line(
          currentCenter.x,
          currentCenter.y,
          target.otherCenter.x,
          target.otherCenter.y
        );
      }
    }

    p5.pop();
  }

  function drawBirdConnectionLinesFromCenters() {
    p5.push();
    p5.stroke(0, 255, 0, 150); // Green lines with transparency
    p5.strokeWeight(2);

    // For each bird detection
    for (let i = 0; i < birdsDetected.length; i++) {
      let currentBox = birdsDetected[i].boundingBox;

      // Get center of current bird
      let currentCenter = {
        x: currentBox.originX + currentBox.width / 2,
        y: currentBox.originY + currentBox.height / 2,
      };

      // Draw lines to all OTHER birds in the same frame
      for (let j = 0; j < birdsDetected.length; j++) {
        if (i !== j) {
          // Don't draw line to itself
          let otherBox = birdsDetected[j].boundingBox;

          // Get center of other bird
          let otherCenter = {
            x: otherBox.originX + otherBox.width / 2,
            y: otherBox.originY + otherBox.height / 2,
          };

          // Draw line from current bird center to other bird center
          p5.line(
            currentCenter.x,
            currentCenter.y,
            otherCenter.x,
            otherCenter.y
          );
        }
      }
    }
    p5.pop();
  }

  function storePreviousDetections() {
    // Store current detections as previous for next frame
    let currentDetections = [];

    for (let detection of birdsDetected) {
      currentDetections.push({
        originX: detection.boundingBox.originX,
        originY: detection.boundingBox.originY,
        width: detection.boundingBox.width,
        height: detection.boundingBox.height,
      });
    }

    // Add to beginning of array (most recent first)
    previousDetections.unshift(currentDetections);

    // Limit the number of previous frames we keep
    if (previousDetections.length > maxPreviousFrames) {
      previousDetections.pop(); // Remove the oldest frame
    }
  }

  function drawTrailFrames() {
    // Draw the trail frames
    for (let i = 0; i < trailFrames.length; i++) {
      let frame = trailFrames[i];
      p5.image(
        frame.birdImage,
        frame.box.originX,
        frame.box.originY,
        frame.box.width,
        frame.box.height
      );
    }
  }
}); // end of p5 sketch
