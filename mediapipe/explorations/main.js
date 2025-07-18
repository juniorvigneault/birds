// import mediapipe detection stuff
import {
  ObjectDetector,
  ImageSegmenter,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

// mediapipe stuff
let lastTimestamp = 0;
// Add these new variables at the top with your other declarations
// Add these new variables at the top with your other declarations
let activeBirdDetection = null; // The currently locked/active bird
let activeBirdId = null; // ID to track the specific bird
let isLockedOnBird = false; // Flag to indicate if we're locked onto a bird
let mouseOutsideTimeout = null; // Timeout for when mouse is outside detection
let timeoutDuration = 2000; // 2 seconds in milliseconds
let objectDetector;
let runningMode = "VIDEO";
let habitusFont;
let loadingGif;
let birdFound = false;
let frameCounter = 0;
let latestBody = null; // To store the latest Kinect skeleton
let detectionFrameSkip = 4; // Detect once every 4 frames (adjust as needed)
let detectionCounter = 0;
let lastTrackingResetTime = Date.now();
let trackingResetInterval = 10000; // 10 seconds

let detectionPerFrames = 4;
let mouseIsMoving = false;
let mouseMoveTimeout;
let birdSamples = {}; // This will store the sound sample for each bird by its index
let isMouseInsideDetection = false;
let mouseIsOverVideo = true;
let lockedBirdBox = null; // The box you're currently assisted into
let assistMargin = 50; // 50px margin outside box
// store the results of the model
let tracking = false;
let playerID = null;
let randomVideoItem;
let results;
let isDetecting = false;
let currentVideoIndex;
let birdImageCreated = false;
let boxBlue = true;
let moodFetched = false;
let currentMood = "";
let detectionFlag = true; // This will track whether detection has already run
let timeout;
// let cutOutBirdImage;
let maskImage;
let birdIsSegmented = false;
// // imageSegmentation
let imageSegmenter;
let labels = [];
let birdsDetected = [];
// let cutOutBirdImage;
let allBirdImages = [];
let birdPreviousPosition = []; // Initialize an empty array to store previous positions
const threshold = 100; // for past detections
const mouseTreshold = 100;
let isVisible = false;
let frames = 0;
// video variable for footage
let birdFootage = {
  videoFeed: undefined,
  videoElement: undefined,
  path: undefined,
  isRunning: false,
  width: 480,
  height: 360,
  isReady: false,
};
let showingBirdCam = false;
let overlay;
let isMouseHover = false;
let capturedFrame;
let earCursor;
let birdIndex = 0;
let tagged = false;
let circleMask;
let circleMaskSize = 400;
let minCircleSize = 355;
let maxCircleSize = 420; // or whatever you want for expansion
let birdTracked = false;
let isMouseInside = false;
let birdTrackedPosition = {};
let minDistance = 1000;
let samples = [];
let numVideos = 63;
let numSamples = 247;
let isSamplePlaying = false;
let soundOn = false;
let currentSound;
let birdCounter;
let canvas;
let birdVideo;
// vanilla switch
let ctx;
let vanillaCanvas;
let vanillaSamples = [];
let svgURLObject;
let kinectron;

window.onload = function () {
  document.getElementById("startButton").addEventListener("click", function () {
    // Your function to run when the button is clicked
    let content = document.querySelector("#content");
    let startDialogBox = document.querySelector("#startModal");
    startDialogBox.style.display = "none";
    content.style.display = "block";
    const svgElement = document.getElementById("custom-cursor");

    setTimeout(function () {
      content.style.opacity = 1;
      startSketch();
    }, 50);
  });
};

function startSketch() {
  let sketch = new p5(function (p5) {
    p5.preload = function () {
      for (let i = 1; i <= numSamples; i++) {
        let sample = p5.loadSound(`assets/sounds/birdSounds/${i}.mp3`, (s) => {
          s.setVolume(0.3); // 👈 set volume for each loaded sample
        });
        samples.push(sample);
      }
    };

    p5.setup = async function () {
      canvas = p5.createCanvas(480, 800);
      isDetecting = false;
      frameCounter = 0; // Add frame counter for detection every 2 frames

      canvas.parent("container");
      loadingGif = document.querySelector("#loadingGif");
      let loadingMessage = document.querySelector("#loadingMessage");

      birdFootage.path = `assets/videos/birds_good.mp4`;

      // Create video with proper event handling
      birdFootage.videoFeed = p5.createVideo(birdFootage.path, () => {
        console.log("Video loaded successfully");
        birdFootage.isReady = true;

        // Set loop and other properties
        birdFootage.videoFeed.elt.loop = true;
        // birdFootage.videoFeed.elt.muted = true;
      });

      overlay = p5.createGraphics(birdFootage.width, birdFootage.height);

      // Access the html video element
      birdFootage.videoElement = birdFootage.videoFeed.elt;

      await initializeObjectDetector();

      // // Add comprehensive event listeners for video state
      // birdFootage.videoElement.addEventListener("loadeddata", () => {
      //   console.log("Video data loaded");
      // });

      // birdFootage.videoElement.addEventListener("canplaythrough", () => {
      // console.log("Video can play through");
      loadingGif.style.display = "none";
      loadingMessage.style.display = "none";
      birdFootage.videoElement.style.visibility = "visible";
      birdFootage.videoElement.play(); // ✅ Correct method call
      // Start detection once video is ready
      birdFootage.videoElement.mute = "true";
      isDetecting = true;
      // });

      async function initializeObjectDetector() {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
        );
        objectDetector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite`,
            delegate: "GPU",
          },
          scoreThreshold: 0.1,
          runningMode: "VIDEO",
        });
      }

      circleMask = p5.createGraphics(circleMaskSize, circleMaskSize);
      birdFootage.videoFeed.parent("container");
    };

    // Modified draw function with sticky bird behavior
    // Modified draw function with sticky bird behavior

    // Modified draw function with random bird selection every frame (chaotic version)
    p5.draw = function () {
      p5.clear(canvas);

      // Only proceed if video is ready
      if (!birdFootage.isReady) {
        return;
      }

      let birdDetectedThisFrame = false;

      // Continuous bird detection every frame
      if (objectDetector && isDetecting) {
        // Perform object detection every frame
        if (
          birdFootage.videoElement &&
          birdFootage.videoElement.readyState >= 2
        ) {
          try {
            // Generate monotonic timestamp - FIXED VERSION
            let currentTime = performance.now();
            if (currentTime <= lastTimestamp) {
              currentTime = lastTimestamp + 1; // Ensure monotonic increase
            }
            lastTimestamp = currentTime;

            const results = objectDetector.detectForVideo(
              birdFootage.videoElement,
              currentTime // Use monotonic timestamp
            );

            birdsDetected = results.detections;
          } catch (error) {
            console.warn("Detection error:", error);
            birdsDetected = []; // Clear detections on error
          }
        }

        // Draw detection boxes and handle random bird selection
        if (birdsDetected.length > 0) {
          // Select a random bird every frame
          let randomBirdIndex = p5.floor(p5.random(birdsDetected.length));
          let randomBird = birdsDetected[randomBirdIndex];
          let box = randomBird.boundingBox;

          // Make sure coordinates are properly scaled
          let scaledBox = {
            originX: box.originX,
            originY: box.originY,
            width: box.width,
            height: box.height,
          };

          // Set the random bird as active
          activeBirdDetection = scaledBox;
          activeBirdId = randomBirdIndex;
          isLockedOnBird = true;

          // Draw rectangle only for the selected bird
          drawRectBird();

          // Update bird tracked position
          birdTrackedPosition = {
            x: scaledBox.originX + scaledBox.width / 2,
            y: scaledBox.originY + scaledBox.height / 2,
          };

          birdTracked = true;
          birdDetectedThisFrame = true;

          // Slow down video for better observation
          // birdFootage.videoElement.playbackRate = 0.3;
          birdFootage.videoElement.muted = true;

          // Play sound if not already playing
          if (!currentSound || !currentSound.isPlaying()) {
            // playRandomSample();
          }

          // Create bird image for the active bird
          createBirdImage(activeBirdDetection);

          // Continue tracking
          getLastPosition();
        } else {
          // No birds detected, reset state
          resetBirdDetection();
        }
      }
    };

    function findClosestBird(activeBird) {
      if (!activeBird || birdsDetected.length === 0) return null;

      let minDistance = Infinity;
      let closestBird = null;

      let activeCenterX = activeBird.originX + activeBird.width / 2;
      let activeCenterY = activeBird.originY + activeBird.height / 2;

      for (let i = 0; i < birdsDetected.length; i++) {
        let box = birdsDetected[i].boundingBox;
        let boxCenterX = box.originX + box.width / 2;
        let boxCenterY = box.originY + box.height / 2;

        let distance = p5.dist(
          activeCenterX,
          activeCenterY,
          boxCenterX,
          boxCenterY
        );

        // Use a reasonable threshold to determine if it's the same bird
        if (distance < 100 && distance < minDistance) {
          minDistance = distance;
          closestBird = {
            originX: box.originX,
            originY: box.originY,
            width: box.width,
            height: box.height,
          };
        }
      }

      return closestBird;
    }
    // New function to reset bird detection
    function resetBirdDetection() {
      // Clear the active bird
      activeBirdDetection = null;
      activeBirdId = null;
      isLockedOnBird = false;

      birdTracked = false;
      showingBirdCam = false;

      // Resume normal video playback
      birdFootage.videoElement.playbackRate = 1;
      // birdFootage.videoElement.muted = false;

      // Stop all samples
      stopAllSamples();
    }
    function playRandomSample() {
      let randomIndex = p5.floor(p5.random(samples.length));
      currentSound = samples[randomIndex];
      currentSound.loop(); // Or .play() if you don't want looping
    }

    // Function to stop the currently playing sample
    function stopAllSamples() {
      if (currentSound && currentSound.isPlaying()) {
        currentSound.stop();
        currentSound = null;
      }
    }
    function drawRectBird() {
      p5.push();
      p5.strokeWeight(2);

      // Only draw the rectangle for the active (randomly selected) bird
      if (activeBirdId !== null && activeBirdId < birdsDetected.length) {
        let box = birdsDetected[activeBirdId].boundingBox;

        // Active bird gets a blue rectangle
        p5.stroke(0, 255, 0);
        p5.fill(0, 0, 255, 50); // Semi-transparent blue fill

        // Draw rectangle with exact coordinates from detection
        p5.rect(box.originX, box.originY, box.width, box.height);
      }

      p5.pop();
    }

    function createBirdImage(box) {
      if (!birdFootage.videoFeed) return;

      try {
        // Get pixels inside the bounding box of the specific bird
        let birdImage = birdFootage.videoFeed.get(
          box.originX - 15,
          box.originY - 15,
          box.width + 30,
          box.height + 30
        );

        // Display the specific bird in the bird cam
        displayBirdCam(birdImage, box);
      } catch (error) {
        console.warn("Error creating bird image:", error);
      }
    }

    function getLastPosition() {
      if (birdTracked && isLockedOnBird && activeBirdDetection) {
        // Update the tracked position to the active bird's position
        birdTrackedPosition.x =
          activeBirdDetection.originX + activeBirdDetection.width / 2;
        birdTrackedPosition.y =
          activeBirdDetection.originY + activeBirdDetection.height / 2;
        showingBirdCam = true;
      } else {
        showingBirdCam = false;
      }
    }
    function spotlight(box) {
      p5.push();

      // Create a graphics buffer for the dark overlay
      // Draw a dark rectangle over the entire buffer
      overlay.clear();
      overlay.fill(0, 0, 0, 80);
      overlay.rect(0, 0, birdFootage.width, birdFootage.height);
      // Erase a rectangular area around the detected bird
      overlay.erase();
      overlay.rect(box.originX, box.originY, box.width, box.height);
      overlay.noErase();
      // Draw the buffer onto the main canvas
      p5.imageMode(p5.CORNER);
      p5.image(overlay, 0, 0);
      p5.pop();
    }

    // SABINE VERSION
    function displayBirdCam(bird, box) {
      if (!bird || !box) return;

      // spotlight(box);
      let halfWidth = p5.width / 2;

      // Draw the bird and mask
      circleMask.fill(0, 0, 0, 255);
      circleMask.circle(circleMaskSize / 2, circleMaskSize / 2, circleMaskSize);

      try {
        bird.mask(circleMask);
      } catch (error) {
        console.warn("Error masking bird image:", error);
        return;
      }

      p5.imageMode(p5.CENTER);

      // lines(box, halfWidth);
      p5.image(
        bird,
        p5.width / 2,
        p5.height / 2 + circleMaskSize / 2,
        circleMaskSize,
        circleMaskSize
      );

      // Add mood box
      // moodBox(p5.width / 2 + 100, p5.height / 2 + circleMaskSize / 2 + 100);
    }

    function moodBox(x, y) {
      // Fetch and display the mood only once
      if (!moodFetched) {
        currentMood = "";
        getRandomMood().then((mood) => {
          currentMood = mood; // Store the fetched mood
          console.log(currentMood); // Log the mood or display it in your sketch
          moodFetched = true; // Set the flag so it won't fetch again
        });
      }

      p5.push();
      p5.noStroke();
      p5.textAlign(p5.LEFT);
      p5.textSize(12);
      p5.fill(0);
      p5.text("Current Mood ↓", x - 25, y - 7);
      p5.textSize(17);
      p5.fill(0);
      p5.text(currentMood, x - 25, y + 12);
      p5.pop();
    }

    function lines(box, halfWidth) {
      p5.push();
      p5.stroke(0, 255, 0);
      p5.strokeWeight(2);

      // Circle center
      let cx = p5.width / 2;
      let cy = p5.height / 2 + circleMaskSize / 2;
      let r = circleMaskSize / 2;

      // Box center
      let bx = box.originX + box.width / 2;
      let by = box.originY + box.height / 2;

      // Compute vector from box center to circle center
      let dx = cx - bx;
      let dy = cy - by;
      let distToCircle = Math.sqrt(dx * dx + dy * dy);

      // Compute angle from box center to circle center
      let angleToCircle = Math.atan2(dy, dx);

      // Compute the angle for the tangents
      let offsetAngle = Math.asin(r / distToCircle); // Angle offset for tangents

      // Get perpendicular angles for the tangent lines
      let tangentAngle1 = angleToCircle + offsetAngle + Math.PI / 2;
      let tangentAngle2 = angleToCircle - offsetAngle - Math.PI / 2;

      // Compute the exact tangent points on the circle
      let x1 = cx + r * Math.cos(tangentAngle1);
      let y1 = cy + r * Math.sin(tangentAngle1);
      let x2 = cx + r * Math.cos(tangentAngle2);
      let y2 = cy + r * Math.sin(tangentAngle2);

      // Draw tangent lines from the box center to the circle's edge
      p5.line(bx, by, x1, y1);
      p5.line(bx, by, x2, y2);
      p5.pop();
    }

    // Add the getRandomMood function from the second file
    async function getRandomMood() {
      try {
        const response = await fetch("moods.json");
        const data = await response.json();
        const moods = data.moods;
        const randomIndex = Math.floor(Math.random() * moods.length);
        return moods[randomIndex];
      } catch (error) {
        console.error("Error fetching the JSON file:", error);
        return "mysterious"; // fallback mood
      }
    }
  }); // end of p5 sketch
}
