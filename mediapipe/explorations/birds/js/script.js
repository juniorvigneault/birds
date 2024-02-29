// Import the initializeObjectDetector function from the initialization file
import {
    initializeObjectDetector,
    getObjectDetector
} from './ObjectDetection.js';

import p5 from 'p5';

let video;

let sketch = function (p) {
    p.setup = function () {
        p.createCanvas(300, 300);
        video = p.createCapture(p.VIDEO);
        video.size(p.width, p.height);
        initializeObjectDetector();
    };

    p.draw = function () {
        p.background(0);

    };
};

let myp5 = new p5(sketch);

// let sketch = new p5(function (p) {
//             p.setup = function () {
//                 createCanvas(640, 480);
//                 video = createCapture(VIDEO);
//                 video.size(width, height);
//                 video.hide(); // Hide the video element
//                 initializeObjectDetector(); // Initialize the object detector    };

//                 p.draw = function () {
//                     // Your draw code here
//                 };
//             });