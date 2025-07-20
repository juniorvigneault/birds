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

// Grid system variables
let gridSize = 30; // Size of each grid square (adjust as needed)
let gridCols, gridRows;
let gridSlots = []; // Array to track which grid positions are filled
let availableSlots = []; // Array of available grid positions
let filledSlots = []; // Array of filled grid positions with their images

// video variable for footage
let birdFootage = {
  p5VideoLayer: undefined,
  htmlVideoLayer: undefined,
  path: "assets/videos/birds_1.mp4",
  isRunning: false,
  width: 786,
  height: 588,
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

    // Initialize grid system
    initializeGrid();

    // initialize bird detection
    await initializeObjectDetector();
    // initialize bird segmentation
    birdFootage.p5VideoLayer.loop();
    isDetecting = true;
    birdFootage.htmlVideoLayer = document.querySelector("video");
    birdFootage.htmlVideoLayer.muted = true;
  };

  // Initialize the grid system
  function initializeGrid() {
    gridCols = Math.floor(birdFootage.width / gridSize);
    gridRows = Math.floor(birdFootage.height / gridSize);

    // Initialize all slots as available
    availableSlots = [];
    filledSlots = [];

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        availableSlots.push({ col: col, row: row });
      }
    }

    // Shuffle available slots for random filling
    shuffleArray(availableSlots);
  }

  // Fisher-Yates shuffle algorithm
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // run video and detections and draw rectangles around birds
  p5.draw = function () {
    p5.background(255);

    // Draw the grid background (optional - for visualization)
    // drawGridBackground();

    // Draw all filled slots
    drawFilledSlots();

    // if the the model is initialized, run detection on video and process new detections
    if (objectDetector && isDetecting) {
      // put the detections of the video in results
      results = objectDetector.detectForVideo(
        birdFootage.htmlVideoLayer,
        p5.millis()
      );

      birdsDetected = results.detections;

      // Process new bird detections and add them to grid
      if (birdsDetected.length > 0) {
        createBirdImages();
        addDetectionsToGrid();
      }
    }
  }; // end of draw

  // Optional: Draw grid lines for visualization (remove if not needed)
  function drawGridBackground() {
    p5.push();
    p5.stroke(240);
    p5.strokeWeight(0.5);

    // Draw vertical lines
    for (let col = 0; col <= gridCols; col++) {
      let x = col * gridSize;
      p5.line(x, 0, x, birdFootage.height);
    }

    // Draw horizontal lines
    for (let row = 0; row <= gridRows; row++) {
      let y = row * gridSize;
      p5.line(0, y, birdFootage.width, y);
    }
    p5.pop();
  }

  // Draw all the filled grid slots
  function drawFilledSlots() {
    for (let slot of filledSlots) {
      let x = slot.col * gridSize;
      let y = slot.row * gridSize;
      p5.image(slot.image, x, y, gridSize, gridSize);
    }
  }

  // Add new detections to random grid positions
  function addDetectionsToGrid() {
    for (let i = 0; i < allBirdImages.length; i++) {
      let birdImage = allBirdImages[i];

      // Resize the bird image to fit the grid square
      let resizedBirdImage = p5.createGraphics(gridSize, gridSize);
      resizedBirdImage.image(birdImage, 0, 0, gridSize, gridSize);

      // Get a random grid position
      let gridPosition = getRandomGridPosition();

      if (gridPosition) {
        // Add to filled slots
        filledSlots.push({
          col: gridPosition.col,
          row: gridPosition.row,
          image: resizedBirdImage,
        });
      }
    }
  }

  // Get a random grid position (either available or replace existing)
  function getRandomGridPosition() {
    if (availableSlots.length > 0) {
      // If there are still available slots, use one
      return availableSlots.pop();
    } else {
      // If all slots are filled, randomly replace an existing one
      let randomIndex = Math.floor(Math.random() * filledSlots.length);
      let position = filledSlots[randomIndex];

      // Remove the old slot and return its position
      filledSlots.splice(randomIndex, 1);

      return { col: position.col, row: position.row };
    }
  }

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

  // Optional: Add a function to clear the grid and start over
  function clearGrid() {
    initializeGrid();
  }

  // Optional: Add a function to change grid size
  function setGridSize(newSize) {
    gridSize = newSize;
    initializeGrid();
  }
}); // end of p5 sketch
