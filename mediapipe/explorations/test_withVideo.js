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
let results;
let isDetecting = false;
let birdImageCreated = false;
let boxBlue = true;
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
  height: 360,
};

let earCursor;
let birdIndex = 0;
let tagged = false;
let circleMask;
let circleMaskSize = 500;
let birdTracked = false;
let isMouseInside = false;
let birdTrackedPosition = {};
let minDistance = 1000;
let samples = [];
let numVideos = 13;
let numSamples = 173;
let isSamplePlaying = false;
let soundOn = false;
let currentSound;
let birdCounter;
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
    let canvas = p5.createCanvas(birdFootage.width, 900);

    canvas.parent("container");

    // create video footage
    let randomVideoItem = Math.floor(p5.random(0, 13));
    // birdFootage.path = `assets/videos/${randomVideoItem}.mp4`;
    birdFootage.path = `assets/videos/2.mp4`;

    birdFootage.videoFeed = p5.createVideo(birdFootage.path);
    // birdFootage.videoFeed.hide();
    // birdFootage.videoFeed.size(birdFootage.width, birdFootage.height);
    birdFootage.videoFeed.parent("container");
    birdFootage.videoFeed.play();
    birdFootage.videoFeed.loop();
    // access the html video element of the video
    birdFootage.videoElement = document.querySelector("video");

    await initializeObjectDetector();

    let randomTime = p5.random(50, 200);

    birdFootage.videoElement.currentTime = randomTime;

    // birdFootage.htmlVideoLayer.style.zIndex = '-1';
    circleMask = p5.createGraphics(circleMaskSize, circleMaskSize);

    isDetecting = true;
    about();
    // birdCounter = document.getElementById('birdCount');
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
      scoreThreshold: 0.15,
      runningMode: "VIDEO",
    });
  }

  function changeVideo() {
    if (document.querySelector("video") !== undefined) {
      document.querySelector("video").remove();
    }
    // Increment the birdIndex to select the next video
    // let randomVideoItem = Math.floor(p5.random(0, 13));
    birdFootage.path = `assets/videos/0.mp4`;
    // Load and play the new video
    birdFootage.videoFeed = p5.createVideo(birdFootage.path);
    birdFootage.videoFeed.hide();
    birdFootage.videoFeed.parent("container");
    birdFootage.videoFeed.play();
    birdFootage.videoFeed.loop();
    // Update the video element
    birdFootage.videoElement = document.querySelector("video");
    // let lengthOfVideo = birdFootage.videoElement.duration;
    let randomTime = p5.random(50, 200);

    birdFootage.videoElement.currentTime = randomTime;

    results = objectDetector.detectForVideo(
      birdFootage.videoElement,
      p5.millis()
    );
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
  };

  function about() {
    const aboutButton = document.getElementById("aboutButton");
    const aboutText = document.getElementById("aboutText");

    let timer;
    isVisible = false;

    function toggleAbout() {
      if (!isVisible) {
        aboutText.style.display = "block";
        isVisible = true;
        timer = setTimeout(() => {
          aboutText.style.display = "none";
          isVisible = false;
        }, 15000);
      } else {
        clearTimeout(timer);
        aboutText.style.display = "none";
        isVisible = false;
      }
    }

    aboutButton.addEventListener("click", toggleAbout);
  }

  p5.mouseReleased = function () {
    if (birdTracked) {
      birdTracked = false;

      birdFootage.videoElement.playbackRate = 1;
      if (currentSound) {
        currentSound.stop();
      }

      // changeVideo();
    }
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
    p5.frameRate(25);
    // p5.background(0);
    p5.background(255);
    // copy the video stream to the canvas and position it under it
    p5.push();
    p5.imageMode(p5.CENTER);
    p5.image(
      birdFootage.videoFeed,
      p5.width / 2,
      birdFootage.height / 2,
      birdFootage.width,
      birdFootage.height
    );
    p5.pop();
    // if the the model is initialized, run detection on video and draw rectangles around birds
    if (objectDetector && isDetecting) {
      // put the detections of the video in results
      // if (frames < 2) {
      results = objectDetector.detectForVideo(
        birdFootage.videoElement,
        p5.millis()
      );
      // }
      // frames++
      birdsDetected = results.detections.filter(
        (detection) => detection.categories[0].categoryName === "bird"
      );
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
        p5.cursor("pointer");
      } else {
        p5.cursor("default");
      }
      p5.noFill();
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

  // me version
  // function getLastPosition() {
  //   console.log(birdFootage.videoElement.playbackRate)
  //   // Iterate through all detections
  //   for (let i = 0; i < birdsDetected.length; i++) {
  //     let box = birdsDetected[i].boundingBox;

  //     // Check if the mouse is inside the bounding box of the current bird
  //     isMouseInside = p5.mouseX > box.originX && p5.mouseX < box.originX + box.width &&
  //       p5.mouseY > box.originY && p5.mouseY < box.originY + box.height;

  //     // Store the current position as the previous position for next iteration
  //     birdPreviousPosition[i] = {
  //       x: box.originX + box.width / 2,
  //       y: box.originY + box.height / 2
  //     };

  //     // If mouse is inside the bounding box, and it's the same bird as the last time, create bird image
  //     if (isMouseInside && p5.dist(birdPreviousPosition[i].x, birdPreviousPosition[i].y, p5.mouseX, p5.mouseY) < threshold) {
  //       createBirdImage(box);
  //       birdFootage.videoElement.playbackRate = 0.1;
  //     } else {
  //       birdFootage.videoElement.playbackRate = 1;

  //     }
  //   }
  // }

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
      lines(newTrackedBox);

      createBirdImage(newTrackedBox);
      birdTrackedPosition.x = newTrackedBox.originX + newTrackedBox.width / 2;
      birdTrackedPosition.y = newTrackedBox.originY + newTrackedBox.height / 2;
      minDistance = 1000;
    }
  }

  // ME VERSION
  // function displayBirdCam(bird, box) {
  //   // Draw the bird and mask
  //   circleMask.fill(0, 0, 0, 255);
  //   circleMask.circle(circleMaskSize / 2, circleMaskSize / 2, circleMaskSize);
  //   lines(box, bird);
  //   bird.mask(circleMask);
  //   p5.imageMode(p5.CENTER);
  //   p5.image(bird, p5.width / 2, p5.height / 2 + circleMaskSize / 2, circleMaskSize, circleMaskSize);
  // }

  // SABINE VERSION
  function displayBirdCam(bird) {
    // Draw the bird and mask
    circleMask.fill(0, 0, 0, 255);
    circleMask.circle(circleMaskSize / 2, circleMaskSize / 2, circleMaskSize);
    // lines(box, bird);
    bird.mask(circleMask);
    p5.imageMode(p5.CENTER);
    p5.image(
      bird,
      p5.width / 2,
      p5.height / 2 + circleMaskSize / 2 - 54,
      circleMaskSize,
      circleMaskSize
    );
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

      // if (boxBlue) {
      //   p5.fill(0, 0, 255, 100)
      // } else if (!boxBlue) {
      //   p5.fill(0, 200, 0, 100)
      // }
      // p5.stroke(230, 0, 0)
      // p5.rect(box.originX, box.originY, box.width, box.height)
      // p5.fill(0)
      // p5.textFont(habitusFont)
      p5.text(
        Math.floor(birdsDetected[i].categories[0].score * 100) % 100,
        box.originX,
        box.originY
      );
      // p5.fill(0);
      // p5.ellipse(box.originX - 10, box.originY + 5, 5, 5)
      p5.pop();
    }
  }
}); // end of p5 sketch
