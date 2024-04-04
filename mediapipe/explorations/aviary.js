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

let birdWindows = [];
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
        if (objectDetector) {
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

        if (birdsDetected.length > 0) {
            let newWindow = window.open("", "_blank", "width=400,height=400");
        }
        // Close excess windows if the maximum threshold is exceeded
        while (birdWindows.length > 5) {
            let windowToClose = birdWindows.pop();
            windowToClose.close();
        }

        // if (objectDetector) {
        //     for (let i = 0; i < allBirdImages.length; i++) {
        //         let birdImage = allBirdImages[i];
        //         let bird = birdsDetected[i];
        //         let box = birdsDetected[i].boundingBox;

        //         // Check if the maximum threshold is reached
        //         if (birdWindows.length >= 5) {
        //             alert("Maximum number of popups reached. Please close some windows to continue.");
        //             break; // Exit the loop
        //         }


        // let newWindow = window.open("", "_blank", "width=400,height=400");
        // if (newWindow) {

        // }
        // Check if the new window is opened successfully
        // if (newWindow) {
        //     // Set position of the new window to the position of the detection
        //     newWindow.moveTo(box.originX, box.originY);

        //     // Create an image element in the new window and set the bird image as its source
        //     let imgElement = newWindow.document.createElement('img');
        //     imgElement.src = birdImage.canvas.toDataURL(); // Convert the bird image to data URL
        //     imgElement.style.width = '100%'; // Make sure the image fills the window width
        //     imgElement.style.height = '100%'; // Make sure the image fills the window height
        //     newWindow.document.body.appendChild(imgElement); // Append the image to the new window

        //     // Push the reference to the new window to the array
        //     birdWindows.push(newWindow);
        // } else {
        //     alert("Popup blocked! Please allow popups to view bird images.");
        // }


        // }
        // }

    }

    function drawDetectedBirds() {
        if (birdImageCreated) {
            for (let i = 0; i < allBirdImages.length; i++) {
                let bird = allBirdImages[i];
                let box = birdsDetected[i].boundingBox;

                // Draw the current frame of detected birds on the main canvas
                p5.image(bird, box.originX, box.originY, box.width, box.height);
            }
        }
    }

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