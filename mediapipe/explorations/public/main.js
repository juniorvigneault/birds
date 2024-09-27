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
let socket;
let frameCounter = 0;
let detectionPerFrames = 4;
// store the results of the model
let randomVideoItem;
let results;
let isDetecting = false;
let currentVideoIndex;
let birdImageCreated = false;
let boxBlue = true;
let moodFetched = false;
let currentMood = "";
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
  width: 640,
  height: 480,
};

let earCursor;
let birdIndex = 0;
let tagged = false;
let circleMask;
let circleMaskSize = 475;
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

window.onload = function () {
  // document.getElementById("startButton").addEventListener("click", function () {
  //   // Your function to run when the button is clicked
  let content = document.querySelector("#content");
  //   let startDialogBox = document.querySelector("#startModal");
  // startDialogBox.style.display = "none";
  content.style.display = "block";
  setTimeout(function () {
    content.style.opacity = 1;
    startSketch();
  }, 50);
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

      canvas.parent("container");
      loadingGif = document.querySelector("#loadingGif");
      let loadingMessage = document.querySelector("#loadingMessage");

      // create video footage
      randomVideoItem = Math.floor(p5.random(0, numVideos));
      currentVideoIndex = randomVideoItem;
      birdFootage.path = `assets/videos/${randomVideoItem}.mp4`;
      // birdFootage.path = `assets/videos/0.mp4`;

      birdFootage.videoFeed = p5.createVideo(birdFootage.path);
      // birdFootage.videoFeed.position(0, 0);
      // birdFootage.videoFeed.hide();

      // birdFootage.videoFeed.size(birdFootage.width, birdFootage.height);

      // access the html video element of the video
      birdFootage.videoElement = document.querySelector("video");

      await initializeObjectDetector();

      loadingGif.style.display = "none";

      loadingMessage.style.display = "none";
      birdFootage.videoElement.style.visibility = "visible";
      // birdFootage.htmlVideoLayer.style.zIndex = '-1';
      circleMask = p5.createGraphics(circleMaskSize, circleMaskSize);

      isDetecting = true;
      birdFootage.videoFeed.parent("container");
      // birdFootage.videoFeed.play();
      birdFootage.videoFeed.loop();
      birdFootage.videoFeed.volume = 0;

      socket = io();
    };

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

    function changeVideo() {
      canvas.hide();
      if (document.querySelector("video") !== undefined) {
        document.querySelector("video").remove();
      }

      loadingGif.style.display = "block";

      setTimeout(() => {
        currentVideoIndex = (currentVideoIndex + 1) % numVideos;

        birdFootage.path = `assets/videos/${currentVideoIndex}.mp4`;

        // Load and play the new video
        birdFootage.videoFeed = p5.createVideo(birdFootage.path);
        // birdFootage.videoFeed.position(0, 0);

        birdFootage.videoFeed.parent("container");

        birdFootage.videoFeed.elt.addEventListener("loadeddata", () => {
          // birdFootage.videoFeed.play();
          birdFootage.videoFeed.loop();
          birdFootage.videoFeed.volume = 0;

          birdFootage.videoElement = document.querySelector("video");
          // results = objectDetector.detectForVideo(
          //   birdFootage.videoElement,
          //   p5.millis()
          // );

          setTimeout(() => {
            loadingGif.style.display = "none";
            birdFootage.videoElement.style.visibility = "visible";
            canvas.show();
          }, 500);
        });

        // Update the video element

        // Results are detected for the current video element
      }, 2000);
      // Increment the currentVideoIndex to select the next video
    }

    function spotlight(box) {
      p5.push();

      // Create a graphics buffer for the dark overlay
      let overlay = p5.createGraphics(p5.width, birdFootage.height - 60);
      // Draw a dark rectangle over the entire buffer
      overlay.fill(0, 0, 0, 170);
      overlay.rect(0, 60, p5.width, birdFootage.height);

      // Erase a rectangular area around the detected bird
      overlay.erase();
      overlay.rect(box.originX, box.originY, box.width, box.height);
      overlay.noErase();

      // Draw the buffer onto the main canvas
      p5.imageMode(p5.CORNER);
      p5.image(overlay, 0, 0);
      p5.pop();
    }

    // run video and detections and draw rectangles around birds
    p5.mousePressed = function () {
      birdTracked = false;
      isSamplePlaying = false;
      if (!birdTracked) {
        for (let i = 0; i < birdsDetected.length; i++) {
          let box = birdsDetected[i].boundingBox;
          // Check if the mouse is inside the bounding box of the current bird
          isMouseInside =
            p5.mouseX > box.originX &&
            p5.mouseX < box.originX + box.width &&
            p5.mouseY > box.originY &&
            p5.mouseY < box.originY + box.height;

          if (isMouseInside) {
            // Store the current position as the previous position for next iteration
            birdTrackedPosition = {
              x: box.originX + box.width / 2,
              y: box.originY + box.height / 2,
            };
            birdTracked = true;
            birdFootage.videoElement.playbackRate = 0.15;
            birdFootage.videoElement.muted = true;
            playSample();
          }
        }
      }
      // send to other page
      socket.emit("mouseState", { isClicked: true });
    };

    p5.mouseReleased = function () {
      currentMood = "";
      if (birdTracked) {
        moodFetched = false; // Reset the flag so a new mood can be fetched next time
        currentMood = ""; // Clear the current mood
        birdTracked = false;
        loadingGif.style.display = "none";
        birdFootage.videoElement.playbackRate = 1;
        if (currentSound) {
          currentSound.stop();
        }

        changeVideo();
      }
      socket.emit("mouseState", { isClicked: false });
    };

    function playSample() {
      // If there's a sound currently playing, stop it
      if (currentSound) {
        currentSound.stop();
      }

      // Choose a random sound sample from the array
      let randomIndex = p5.floor(p5.random(samples.length));
      currentSound = samples[randomIndex];

      // Play the selected sound sample
      currentSound.loop();
    }

    p5.draw = function () {
      p5.clear(canvas);

      // if the the model is initialized, run detection on video and draw rectangles around birds
      if (objectDetector && isDetecting) {
        // put the detections of the video in results
        if (frameCounter % 2 === 0) {
          // Perform object detection only every 2 frames
          const results = objectDetector.detectForVideo(
            birdFootage.videoElement,
            p5.millis()
          );
          birdsDetected = results.detections.filter(
            (detection) => detection.categories[0].categoryName === "bird"
          );
        }

        // console.log(results, birdsDetected)
        // draw a rect around each bird
        if (birdsDetected.length > 0) {
          getLastPosition();
          drawRectBird();
        }

        if (birdsDetected.length < 1) {
          if (currentSound) {
            currentSound.stop();
          }
        }

        // birdCount();
      }
      frameCounter++;
    };

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
    function displayBirdCam(bird, box) {
      spotlight(box);
      // lines(box);

      // Draw the bird and mask
      circleMask.fill(0, 0, 0, 255);
      circleMask.circle(circleMaskSize / 2, circleMaskSize / 2, circleMaskSize);
      // lines(box, bird);
      bird.mask(circleMask);
      p5.imageMode(p5.CENTER);
      // p5.image(
      //   bird,
      //   p5.width / 2,
      //   p5.height / 2 + circleMaskSize / 2 - 20,
      //   circleMaskSize,
      //   circleMaskSize
      // );

      let birdCanvas = bird.canvas.toDataURL(); // Assuming 'bird' is a p5.Image
      socket.emit("birdImage", { image: birdCanvas }); // Send image over socket
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
      }
    }

    function lines(box) {
      p5.push();

      p5.rect();

      p5.stroke(0, 255, 0);
      p5.strokeWeight(1);
      p5.line(
        p5.width / 2 - circleMaskSize / 2,
        p5.height / 2 + circleMaskSize / 2,
        box.originX + box.width / 2,
        box.originY + box.height / 2
      );
      p5.line(
        p5.width / 2 + circleMaskSize / 2,
        p5.height / 2 + circleMaskSize / 2,
        box.originX + box.width / 2,
        box.originY + box.height / 2
      );
      p5.pop();
    }
  }); // end of p5 sketch
}
