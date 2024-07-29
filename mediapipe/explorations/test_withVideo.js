// Import Mediapipe detection stuff
import {
  FilesetResolver,
  HandLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// Matter.js components
const {
  Engine,
  Events,
  Runner,
  Bodies,
  Vector,
  Body,
  Composite,
  World,
  Composites,
  MouseConstraint,
  Mouse,
  Constraint,
} = Matter;

let engine, world, mouseConstraint, streamCanvas, handsCanvas;
let particles = [],
  trailFrames = [],
  handsDetected = [];
let handLandmarker, habitusFont, results;
let isDetecting = false,
  handImageCreated = false;
let landmarkPixelSize,
  handFootage = {
    p5VideoLayer: undefined,
    htmlVideoLayer: undefined,
    path: "images/small_crowd.mp4",
    isRunning: false,
    width: 640,
    height: 480,
    margin: 10,
  };
let allHandImages = [];

const maxTrailFrames = 1000; // Maximum number of frames to keep in the trail

// let stream = new p5((s) => {
//   s.setup = function () {
//     streamCanvas = s.createCanvas(handFootage.width, handFootage.height);
//     streamCanvas.parent("stream-canvas");
//     createEngine();
//     // setInterval(makeStream, 100); // Lower the frequency if necessary
//   };

//   s.draw = function () {
//     s.background(0);
//     s.clear(streamCanvas);
//     drawParticles(s);
//     Engine.update(engine);
//     checkHandInteractions(s);
//     makeStream();
//   };

//   function createEngine() {
//     engine = Engine.create();
//     world = engine.world;
//     Runner.run(engine);

//     const mouse = Mouse.create(document.querySelector("#particles-canvas"));
//     mouseConstraint = MouseConstraint.create(engine, { mouse });
//     World.add(world, mouseConstraint);
//   }

//   function makeStream() {
//     // Get the current seconds
//     const currentTime = new Date();
//     const currentSeconds = currentTime.getSeconds();

//     const randomSize = s.random(8, 12);
//     const group = Body.nextGroup(true);

//     const particle = Bodies.circle(s.width / 2, -100, randomSize, {
//       friction: 0,
//       density: 0.5,
//       restitution: 0.7,
//       collisionFilter: { group },
//     });

//     World.add(world, particle);
//     particles.push(particle);

//     const randomFrameCount = s.random(10, 20);
//     if (s.frameCount % 90 > randomFrameCount) {
//       const randomSmall = s.random(5, 8);
//       const smallParticle = Bodies.circle(s.width / 2, -90, randomSmall, {
//         friction: 0,
//         restitution: 0.7,
//         collisionFilter: { group },
//       });

//       World.add(world, smallParticle);
//       particles.push(smallParticle);
//     }
//   }

//   function drawParticles(s) {
//     for (let i = 0; i < particles.length; i++) {
//       const particle = particles[i];
//       s.push();
//       s.fill(0);
//       s.noStroke();
//       s.ellipseMode(s.CENTER);
//       s.ellipse(
//         particle.position.x,
//         particle.position.y,
//         particle.circleRadius * 2
//       );
//       // s.text("10", particle.position.x, particle.position.y);
//       s.pop();

//       if (particle.position.y > 600) {
//         World.remove(world, particle);
//         particles.splice(i, 1);
//         i--;
//       }
//     }
//   }

//   function checkHandInteractions(s) {
//     if (handsDetected.length > 0) {
//       for (const hand of handsDetected) {
//         for (const landmark of hand) {
//           for (const particle of particles) {
//             const distance = s.dist(
//               landmark.x * handFootage.width,
//               landmark.y * handFootage.height,
//               particle.position.x,
//               particle.position.y
//             );

//             if (distance < 50) {
//               const forceDirection = Vector.sub(
//                 { x: particle.position.x, y: particle.position.y },
//                 {
//                   x: landmark.x * handFootage.width,
//                   y: landmark.y * handFootage.height,
//                 }
//               );
//               const force = Vector.mult(Vector.normalise(forceDirection), 5);
//               Body.applyForce(particle, particle.position, force);
//             }
//           }
//         }
//       }
//     }
//   }
// });

let sketch = new p5((p5) => {
  p5.preload = function () {
    habitusFont = p5.loadFont("assets/fonts/Habitus-Medium.otf");
  };

  p5.setup = async function () {
    handFootage.p5VideoLayer = p5.createCapture(p5.VIDEO);
    handsCanvas = p5.createCanvas(handFootage.width, handFootage.height);
    handsCanvas.parent("hands-canvas");
    handFootage.p5VideoLayer.hide();
    await initializeHandDetector();
    handFootage.p5VideoLayer.loop();
    isDetecting = true;
    handFootage.htmlVideoLayer = document.querySelector("video");
    handFootage.htmlVideoLayer.muted = true;
  };

  async function initializeHandDetector() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 10,
    });
  }

  p5.draw = function () {
    // p5.background(255);
    // p5.clear(handsCanvas);

    if (!handFootage.p5VideoLayer) {
      console.error("handFootage or handFootage.p5VideoLayer is undefined");
      return;
    }

    p5.translate(handFootage.width, 0);
    p5.scale(-1, 1);

    const videoBuffer = p5.createGraphics(
      handFootage.width * 2,
      handFootage.height * 2
    );
    videoBuffer.image(
      handFootage.p5VideoLayer,
      0,
      0,
      handFootage.width,
      handFootage.height
    );

    const maskBuffer = p5.createGraphics(handFootage.width, handFootage.height);
    maskBuffer.clear();
    maskBuffer.fill(255);
    maskBuffer.noStroke();

    if (
      handLandmarker &&
      isDetecting &&
      handFootage.p5VideoLayer.elt.readyState >= 2
    ) {
      results = handLandmarker.detectForVideo(
        handFootage.p5VideoLayer.elt,
        p5.millis()
      );
      handsDetected = results.landmarks;
      // drawTrailFrames(p5);
      //
      if (handsDetected.length > 0) {
        for (const hand of handsDetected) {
          // maskBuffer.beginShape();
          for (const point of hand) {
            maskBuffer.vertex(
              point.x * handFootage.width,
              point.y * handFootage.height
            );
            createLandmarkPixels(p5, point);
            drawLandmarkPixels(p5, point);
          }
          // maskBuffer.endShape(p5.CLOSE);
        }

        // const videoImage = videoBuffer.get();
        // videoImage.mask(maskBuffer);
        // p5.image(videoImage, 0, 0, handFootage.width * 2, handFootage.height * 2);
      }
    }
  };

  function createLandmarkPixels(p5, point) {
    allHandImages = [];
    landmarkPixelSize = p5.map(point.z, -10, 5, 100, 0);

    const handImage = handFootage.p5VideoLayer.get(
      point.x * handFootage.width,
      point.y * handFootage.height,
      landmarkPixelSize,
      landmarkPixelSize
    );

    allHandImages.push(handImage);
    handImageCreated = true;
  }

  function drawLandmarkPixels(p5, point) {
    if (handImageCreated) {
      for (const handImage of allHandImages) {
        trailFrames.push({
          handImage,
          x: point.x * handFootage.width,
          y: point.y * handFootage.height,
          size: landmarkPixelSize,
        });

        p5.image(
          handImage,
          point.x * handFootage.width,
          point.y * handFootage.height,
          landmarkPixelSize
        );

        if (trailFrames.length > maxTrailFrames) {
          trailFrames.shift();
        }
      }
    }
  }

  function drawTrailFrames(p5) {
    for (const frame of trailFrames) {
      if (frame.handImage) {
        p5.image(frame.handImage, frame.x, frame.y, frame.size, frame.size);
      } else {
        console.error("Invalid frame image");
      }
    }
  }
});

function fillHsluv(h, s, l, sketch) {
  const rgb = hsluv.hsluvToRgb([h, s, l]);
  sketch.fill(rgb[0] * 255, rgb[1] * 255, rgb[2] * 255);
}

function strokeHsluv(h, s, l, sketch) {
  const rgb = hsluv.hsluvToRgb([h, s, l]);
  sketch.p5.stroke(rgb[0] * 255, rgb[1] * 255, rgb[2] * 255);
}
