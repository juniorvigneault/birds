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
let loadingGif;
let birdFound = false;
let frameCounter = 0;
let detectionPerFrames = 4;
let mouseIsMoving = false;
let mouseMoveTimeout;
let birdSamples = {}; // This will store the sound sample for each bird by its index
let isMouseInsideDetection = false;
let mouseIsOverVideo = true;
// store the results of the model
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
  width: 1024,
  height: 576,
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
let birdTracked = false;
let isMouseInside = false;
let birdTrackedPosition = {};
let minDistance = 1000;
let samples = [];
let numVideos = 63;
let numSamples = 173;
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

window.onload = function () {
  document.getElementById("startButton").addEventListener("click", function () {
    // Your function to run when the button is clicked
    let content = document.querySelector("#content");
    let startDialogBox = document.querySelector("#startModal");
    startDialogBox.style.display = "none";
    content.style.display = "block";
    const svgElement = document.getElementById("custom-cursor");

    // Serialize the SVG to string
    const svgURL = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgURL], { type: "image/svg+xml" });
    svgURLObject = URL.createObjectURL(svgBlob);
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
        // Assuming the file names are numbered from 1 to numSamples
        let sample = p5.loadSound(`assets/sounds/birdSounds/${i}.mp3`);
        samples.push(sample);
      }
    };

    p5.setup = async function () {
      // create a video element from the video footage for the canvas
      // let container = document.querySelector('#container');
      canvas = p5.createCanvas(birdFootage.width, birdFootage.height);
      isDetecting = false;

      canvas.parent("container");
      loadingGif = document.querySelector("#loadingGif");
      let loadingMessage = document.querySelector("#loadingMessage");

      // create video footage
      // randomVideoItem = Math.floor(p5.random(0, numVideos));
      // currentVideoIndex = randomVideoItem;
      birdFootage.path = `assets/videos/birds.mp4`;
      // birdFootage.path = `assets/videos/0.mp4`;

      birdFootage.videoFeed = p5.createVideo(birdFootage.path);
      overlay = p5.createGraphics(birdFootage.width, birdFootage.height);

      // birdFootage.videoFeed.position(0, 0);
      // birdFootage.videoFeed.hide();

      // birdFootage.videoFeed.size(birdFootage.width, birdFootage.height);

      // access the html video element of the video
      birdFootage.videoElement = document.querySelector("video");
      await initializeObjectDetector();

      loadingGif.style.display = "none";

      loadingMessage.style.display = "none";
      jumpToRandomTime();

      birdFootage.videoElement.style.visibility = "visible";
      // birdFootage.htmlVideoLayer.style.zIndex = '-1';
      circleMask = p5.createGraphics(circleMaskSize, circleMaskSize);

      birdFootage.videoFeed.parent("container");
      // birdFootage.videoFeed.play();
      birdFootage.videoFeed.loop();
      // birdFootage.videoFeed.volume = 0;
      let container = document.querySelector("#container");

      container.addEventListener(
        "mouseleave",
        function (event) {
          mouseIsOverVideo = false;
        },
        false
      );
      container.addEventListener(
        "mouseover",
        function (event) {
          mouseIsOverVideo = true;
        },
        false
      );
    };

    p5.draw = function () {
      console.log(mouseIsOverVideo);
      p5.clear(canvas);

      let birdDetectedThisFrame = false;

      for (let i = 0; i < birdsDetected.length; i++) {
        let box = birdsDetected[i].boundingBox;

        let isMouseInside =
          p5.mouseX > box.originX &&
          p5.mouseX < box.originX + box.width &&
          p5.mouseY > box.originY &&
          p5.mouseY < box.originY + box.height;

        if (isMouseInside) {
          container.style.cursor = `url(${svgURLObject}) 5 5, auto`;

          birdTrackedPosition = {
            x: box.originX + box.width / 2,
            y: box.originY + box.height / 2,
          };
          birdTracked = true;
          birdDetectedThisFrame = true;

          // Stop all previous sounds before playing the new one
          if (!birdSamples[i]) {
            // If the bird has no assigned sample, assign one and play it
            playSample(i);
          } else if (!birdSamples[i].isPlaying()) {
            // If the sample exists but isn’t playing, resume it
            birdSamples[i].loop();
          }

          // Mouse is inside a bird detection
          isMouseInsideDetection = true;

          break; // Stop checking once a bird is found
        }
      }

      if (!birdDetectedThisFrame) {
        container.style.cursor = `auto`;
        birdTracked = false;
        stopAllSamples(); // 🔴 Stop all samples when no bird is detected
      }

      if (objectDetector && isDetecting && isMouseHover) {
        if (detectionFlag) {
          const results = objectDetector.detectForVideo(
            birdFootage.videoElement,
            p5.millis()
          );
          birdsDetected = results.detections;
        }

        if (birdsDetected.length > 0) {
          drawRectBird();
          getLastPosition();
        } else {
          stopAllSamples(); // 🔴 Ensure all sounds stop when no birds are detected
        }
      }
    };
    // Function to stop the currently playing sample
    function stopAllSamples() {
      for (let key in birdSamples) {
        if (birdSamples[key] && birdSamples[key].isPlaying()) {
          birdSamples[key].stop();
        }
      }
      isSamplePlaying = false; // Reset flag to prevent unintended restarts
    }

    function playSample(birdIndex) {
      if (!isMouseHover || !isDetecting) return; // Prevent new sounds if detection is off

      // Stop any previously playing sound before starting a new one
      if (birdSamples[birdIndex] && birdSamples[birdIndex].isPlaying()) {
        birdSamples[birdIndex].stop(); // Stop the previous sound if needed
      }

      // Select a random sound
      let randomIndex = p5.floor(p5.random(samples.length));
      let newSound = samples[randomIndex];

      // Store the new sound for the bird
      birdSamples[birdIndex] = newSound;
      newSound.loop(); // Play the new sound
    }

    function captureFrameAndDetect() {
      // console.log("captureFrame");
      capturedFrame = birdFootage.videoFeed;
      isDetecting = true;
    }

    function stopDetection() {
      console.log("stop detection");
    }

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

    p5.mouseMoved = function () {
      clearTimeout(timeout); // Reset the timer when mouse moves
      isMouseHover = true;
      birdFootage.videoFeed.pause();
      captureFrameAndDetect(); // Run detection on the paused frame

      if (!isMouseInsideDetection) {
        // Only reset the timeout if the mouse is outside any detection area
        timeout = setTimeout(() => {
          isMouseHover = false;
          birdFootage.videoFeed.loop();
          detectionFlag = true;
          container.style.cursor = "auto";
          birdFootage.videoElement.muted = false;
          stopAllSamples();
          birdSamples = {}; // Réinitialise l'association des échantillons
        }, 200); // 2-second delay
      }

      // Reset the detection flag if necessary
      if (isMouseInsideDetection) {
        isMouseInsideDetection = false; // Reset after handling the detection inside
      }
    };

    function jumpToRandomTime() {
      let video = birdFootage.videoElement;
      // Check if the video duration is valid and not NaN
      if (isNaN(video.duration) || video.duration === Infinity) {
        console.log("Video duration is not available yet.");
        return; // Exit if duration is not available
      }

      // Generate a random time between 0 and the video's duration
      let randomTime = Math.random() * video.duration;

      // Set the video's current time to the random time
      video.currentTime = randomTime;
      console.log(`Jumping to time: ${randomTime}`);

      // Wait for the video's metadata to be loaded to ensure the duration is available
      video.addEventListener("loadedmetadata", function () {
        jumpToRandomTime(); // Call after video metadata is loaded
      });
    }

    function drawRectBird() {
      for (let i = 0; i < birdsDetected.length; i++) {
        // let bird = allBirdImages[i];
        let box = birdsDetected[i].boundingBox;

        // Check if the mouse is inside the bounding box of the current bird
        let isMouseInside =
          p5.mouseX > box.originX &&
          p5.mouseX < box.originX + box.width &&
          p5.mouseY > box.originY &&
          p5.mouseY < box.originY + box.height;
        p5.stroke(0, 255, 0); // Change color if mouse is inside

        // Draw the bounding box rectangle
        if (isMouseInside) {
          p5.fill(0, 255, 0, 50);
        } else {
          p5.noFill();
        }

        p5.rect(box.originX, box.originY, box.width, box.height);
      }
    }

    function createBirdImage(box) {
      // Get pixels inside the bounding box of the specific bird
      let birdImage = birdFootage.videoFeed.get(
        box.originX - 15,
        box.originY - 15,
        box.width + 30,
        box.height + 30
      );

      // Display the specific bird in the bird cam
      displayBirdCam(birdImage, box);
    }

    // SABINE VERSION
    function getLastPosition() {
      if (birdTracked) {
        let minIndex = -1;
        // console.log(birdTrackedPosition)
        for (let i = 0; i < birdsDetected.length; i++) {
          let box = birdsDetected[i].boundingBox;

          let boxDist = p5.dist(
            birdTrackedPosition.x,
            birdTrackedPosition.y,
            box.originX + box.width / 2,
            box.originY + box.height / 2
          );
          // If mouse is inside the bounding box, and it's the same bird as the last time, create bird image
          if (boxDist < minDistance) {
            minDistance = boxDist;
            minIndex = i;
          }
        }
        let newTrackedBox = birdsDetected[minIndex].boundingBox;

        createBirdImage(newTrackedBox);

        birdTrackedPosition.x = newTrackedBox.originX + newTrackedBox.width / 2;
        birdTrackedPosition.y =
          newTrackedBox.originY + newTrackedBox.height / 2;
        minDistance = 1000;

        showingBirdCam = true;
      } else {
        showingBirdCam = false;
      }
    }

    // SABINE VERSION
    function displayBirdCam(bird, box) {
      spotlight(box);
      let halfWidth = p5.width / 2;
      // lines for birdcam

      // Draw the bird and mask
      circleMask.fill(0, 0, 0, 255);
      circleMask.circle(circleMaskSize / 2, circleMaskSize / 2, circleMaskSize);
      // lines(box, bird);
      bird.mask(circleMask);

      p5.imageMode(p5.CENTER);
      let middleOfBox = box.originX + box.width / 2;
      if (middleOfBox >= birdFootage.width / 2) {
        lines(box, halfWidth);

        p5.image(
          bird,
          p5.width / 2 - halfWidth / 2,
          p5.height / 2,
          circleMaskSize,
          circleMaskSize
        );
      } else {
        lines(box, -halfWidth);

        p5.image(
          bird,
          p5.width / 2 + halfWidth / 2,
          p5.height / 2,
          circleMaskSize,
          circleMaskSize
        );
      }
      // moodBox(p5.width / 2 + 250, p5.height / 2 + circleMaskSize / 2 + 100);
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
      // p5.rectMode(p5.CENTER);
      // p5.fill(255);
      // p5.rect(x, y, 120, 50);
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

      // p5.rect();

      p5.stroke(0, 255, 0);
      p5.strokeWeight(2);

      // Circle center
      let cx = p5.width / 2 - halfWidth / 2;
      let cy = p5.height / 2;
      let r = circleMaskSize / 2;

      // Box center
      // let bx = box.originX + box.width / 2;
      // let by = box.originY + box.height / 2;
      let bx = p5.mouseX;
      let by = p5.mouseY;
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
  }); // end of p5 sketch
}
