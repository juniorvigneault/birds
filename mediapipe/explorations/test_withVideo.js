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
  path: 'images/birds_big.mp4',
  isRunning: false,
  width: 640,
  height: 360
}

// main window resize

// window size beginning 
let winheight = 100;
let winsize = 100;
// window resize amount over time
let x = 5;
// stores url to be loaded into window
let temploc;
let openAviaryButton;

window.onload = (event) => {
  console.log('page loaded')

  openAviaryButton = document.getElementById('openAviaryButton');

  openAviaryButton.addEventListener('click', () => {
    console.log('Aviary Opened!');
    openAviary()
  })
  // runP5();
}

function openAviary() {
  // temploc = thelocation;
  if (!(window.resizeTo && document.all) && !(window.resizeTo && document.getElementById)) {
    window.open(thelocation);
    return;
  }
  win2 = window.open("", "", "scrollbars");
  win2.moveTo(0, 0);
  win2.resizeTo(100, 100);
  go2();
}

function go2() {
  if (winheight >= screen.availHeight - 3) {
    x = 0;
  }
  win2.resizeBy(5, x);
  winheight += 5;
  winsize += 5;
  if (winsize >= screen.width - 5) {
    // win2.location = temploc;
    winheight = 100;
    winsize = 100;
    x = 5;
    return;
  }
  setTimeout("go2()", 50);
}

function runP5() {
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
      birdFootage.p5VideoLayer.loop();
    }
    // run video and detections and draw rectangles around birds
    p5.draw = function () {


      // p5.background(0);
      // copy the video stream to the canvas and position it under it
      birdFootage.htmlVideoLayer = document.querySelector('video');
      birdFootage.htmlVideoLayer.muted = true;
      birdFootage.htmlVideoLayer.style.position = 'fixed';
      birdFootage.htmlVideoLayer.style.top = '0px';
      // birdFootage.htmlVideoLayer.style.zIndex = '-1';

      p5.push();
      // p5.image(birdFootage.p5VideoLayer, 0, 0, birdFootage.width, birdFootage.height);
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
            p5.textFont(habitusFont)
            p5.text(Math.floor(birdsDetected[i].categories[0].score * 100) % 100, box.originX, box.originY);
            p5.fill(0);
            p5.ellipse(box.originX - 10, box.originY + 5, 5, 5)
            p5.pop();
          }
          createBirdImages();
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
        scoreThreshold: 0.5,
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
} // run p5