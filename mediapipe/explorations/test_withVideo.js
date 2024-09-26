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
let cloth;
let img;
const CATEGORY_PENIS = 0x0001;
const CATEGORY_CIRCLE_PARTICLE = 0x0002;
const CATEGORY_RECTANGLE = 0x0004;
const CATEGORY_MOUSE = 0x0008;
let imgLoaded = false;
let clothOptions = {
  x: 0,
  y: 0,
  col: 70,
  row: 20,
  colGap: 2,
  rowGap: 2,
  // crossBrace: true,
  particleRad: 7,
};
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

const maxTrailFrames = 500; // Maximum number of frames to keep in the trail

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

function createEngine() {
  engine = Engine.create();
  world = engine.world;
  Runner.run(engine);
  let mouse = Mouse.create(document.querySelector("#p5js-canvas")),
    mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        // stiffness: 0.0,
      },
      collisionFilter: { category: CATEGORY_MOUSE },
    });

  World.add(world, mouseConstraint);
}

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
function addCloth(p) {
  cloth = createCloth(
    p.width / 2,
    p.height / 2,
    clothOptions.col,
    clothOptions.row,
    clothOptions.colGap,
    clothOptions.rowGap,
    clothOptions.crossBrace,
    clothOptions.particleRad
  );

  Composite.add(world, cloth);
}

function createCloth(
  xx,
  yy,
  columns,
  rows,
  columnGap,
  rowGap,
  crossBrace,
  particleRadius,
  particleOptions,
  constraintOptions
) {
  let group = Body.nextGroup(true);
  particleOptions = Matter.Common.extend(
    {
      inertia: Infinity,
      friction: 0,
      restitution: 0,
      collisionFilter: {
        group: group,
      },
      render: { visible: false },
    },
    particleOptions
  );

  constraintOptions = Matter.Common.extend(
    {
      stiffness: 1,
      // render: { type: "line", anchors: false },
    },
    constraintOptions
  );

  let cloth = Composites.stack(
    xx,
    yy,
    columns,
    rows,
    columnGap,
    rowGap,
    function (x, y) {
      return Bodies.circle(x, y, particleRadius, particleOptions);
    }
  );

  Composites.mesh(cloth, columns, rows, crossBrace, constraintOptions);
  cloth.label = "Cloth Body";

  return cloth;
}

let sketch = new p5((p5) => {
  p5.preload = function () {
    habitusFont = p5.loadFont("assets/fonts/Habitus-Medium.otf");
    img = p5.loadImage("/images/materiality.png");
  };

  p5.setup = async function () {
    handFootage.p5VideoLayer = p5.createCapture(p5.VIDEO);
    handsCanvas = p5.createCanvas(
      handFootage.width,
      handFootage.height,
      p5.WEBGL
    );
    handsCanvas.parent("hands-canvas");
    handFootage.p5VideoLayer.hide();
    await initializeHandDetector();
    handFootage.p5VideoLayer.loop();
    isDetecting = true;
    handFootage.htmlVideoLayer = document.querySelector("video");
    handFootage.htmlVideoLayer.muted = true;
    createEngine();
    addCloth(p5);

    img.loadPixels();
    imgLoaded = true;
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
    p5.background(0);
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
    p5.translate(handFootage.width, 0);
    //then scale it by -1 in the x-axis
    //to flip the image
    p5.scale(-1, 1);
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
      // console.log(handsDetected);

      if (handsDetected.length > 1) {
        let item = 0;
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
          // 4,8,12,16,20
          // maskBuffer.endShape(p5.CLOSE);
        }

        // let point = handsDetected[0].
        // console.log(handsDetected);

        // const videoImage = videoBuffer.get();
        // videoImage.mask(maskBuffer);
        // p5.image(videoImage, 0, 0, handFootage.width * 2, handFootage.height * 2);
        // letters(0);
        // letters2(1);
      }
    }

    if (imgLoaded) {
      // renderClothWithImage(cloth, clothOptions.col, clothOptions.row, p5);
    }
  };
  function renderClothWithImage(cloth, columns, rows, p) {
    // Set texture mode to make it consistent with 2D mode
    p.textureMode(p.NORMAL);

    // Apply texture to the cloth
    p.texture(img);
    p.translate(-p.width / 2, -p.height / 2);

    // Iterate over each cloth particle
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < columns - 1; x++) {
        let index = x + y * columns;
        let nextIndex = index + 1;
        let belowIndex = index + columns;
        let belowNextIndex = belowIndex + 1;

        // Calculate texture coordinates
        let u1 = x / (columns - 1);
        let v1 = y / (rows - 1);
        let u2 = (x + 1) / (columns - 1);
        let v2 = (y + 1) / (rows - 1);
        p.noStroke();
        // Draw the cloth square with texture
        p.beginShape(p.QUADS);
        p.texture(img);
        p.vertex(
          cloth.bodies[index].position.x,
          cloth.bodies[index].position.y,
          u1,
          v1
        );
        p.vertex(
          cloth.bodies[nextIndex].position.x,
          cloth.bodies[nextIndex].position.y,
          u2,
          v1
        );
        p.vertex(
          cloth.bodies[belowNextIndex].position.x,
          cloth.bodies[belowNextIndex].position.y,
          u2,
          v2
        );
        p.vertex(
          cloth.bodies[belowIndex].position.x,
          cloth.bodies[belowIndex].position.y,
          u1,
          v2
        );
        p.endShape(p.CLOSE);
      }
    }
  }
  function letters(hand) {
    p5.push();
    p5.ellipseMode(p5.CENTER);
    p5.ellipse(
      handsDetected[hand][4].x * handFootage.width,
      handsDetected[hand][4].y * handFootage.height,
      40,
      40
    );
    p5.fill(255);
    p5.textAlign(p5.CENTER);
    p5.fill(0);
    p5.textSize(32);
    p5.text(
      "A",
      handsDetected[hand][4].x * handFootage.width,
      handsDetected[hand][4].y * handFootage.height + 10
    );
    p5.pop();

    p5.push();
    p5.ellipseMode(p5.CENTER);
    p5.ellipse(
      handsDetected[hand][8].x * handFootage.width,
      handsDetected[hand][8].y * handFootage.height,
      40,
      40
    );
    p5.fill(255);
    p5.textAlign(p5.CENTER);
    p5.fill(0);
    p5.textSize(32);
    p5.text(
      "S",
      handsDetected[hand][8].x * handFootage.width,
      handsDetected[hand][8].y * handFootage.height + 10
    );
    p5.pop();

    p5.push();
    p5.ellipseMode(p5.CENTER);
    p5.ellipse(
      handsDetected[hand][12].x * handFootage.width,
      handsDetected[hand][12].y * handFootage.height,
      40,
      40
    );
    p5.fill(255);
    p5.textAlign(p5.CENTER);
    p5.fill(0);
    p5.textSize(32);
    p5.text(
      "M",
      handsDetected[hand][12].x * handFootage.width,
      handsDetected[hand][12].y * handFootage.height + 10
    );
    p5.pop();

    p5.push();
    p5.ellipseMode(p5.CENTER);
    p5.ellipse(
      handsDetected[hand][16].x * handFootage.width,
      handsDetected[hand][16].y * handFootage.height,
      40,
      40
    );
    p5.fill(255);
    p5.textAlign(p5.CENTER);
    p5.fill(0);
    p5.textSize(32);
    p5.text(
      "I",
      handsDetected[hand][16].x * handFootage.width,
      handsDetected[hand][16].y * handFootage.height + 10
    );
    p5.pop();

    p5.push();
    p5.ellipseMode(p5.CENTER);
    p5.ellipse(
      handsDetected[hand][20].x * handFootage.width,
      handsDetected[hand][20].y * handFootage.height,
      40,
      40
    );
    p5.fill(255);
    p5.textAlign(p5.CENTER);
    p5.fill(0);
    p5.textSize(32);
    p5.text(
      "S",
      handsDetected[hand][20].x * handFootage.width,
      handsDetected[hand][20].y * handFootage.height + 10
    );
    p5.pop();
  }

  function letters2(hand) {
    p5.push();
    p5.ellipseMode(p5.CENTER);
    p5.ellipse(
      handsDetected[hand][4].x * handFootage.width,
      handsDetected[hand][4].y * handFootage.height,
      40,
      40
    );
    p5.fill(255);
    p5.textAlign(p5.CENTER);
    p5.fill(0);
    p5.textSize(32);
    p5.text(
      "L",
      handsDetected[hand][4].x * handFootage.width,
      handsDetected[hand][4].y * handFootage.height + 10
    );
    p5.pop();

    p5.push();
    p5.ellipseMode(p5.CENTER);
    p5.ellipse(
      handsDetected[hand][8].x * handFootage.width,
      handsDetected[hand][8].y * handFootage.height,
      40,
      40
    );
    p5.fill(255);
    p5.textAlign(p5.CENTER);
    p5.fill(0);
    p5.textSize(32);
    p5.text(
      "A",
      handsDetected[hand][8].x * handFootage.width,
      handsDetected[hand][8].y * handFootage.height + 10
    );
    p5.pop();

    p5.push();
    p5.ellipseMode(p5.CENTER);
    p5.ellipse(
      handsDetected[hand][12].x * handFootage.width,
      handsDetected[hand][12].y * handFootage.height,
      40,
      40
    );
    p5.fill(255);
    p5.textAlign(p5.CENTER);
    p5.fill(0);
    p5.textSize(32);
    p5.text(
      "B",
      handsDetected[hand][12].x * handFootage.width,
      handsDetected[hand][12].y * handFootage.height + 10
    );
    p5.pop();

    p5.push();
    p5.ellipseMode(p5.CENTER);
    p5.ellipse(
      handsDetected[hand][16].x * handFootage.width,
      handsDetected[hand][16].y * handFootage.height,
      40,
      40
    );
    p5.fill(255);
    p5.textAlign(p5.CENTER);
    p5.fill(0);
    p5.textSize(32);
    p5.text(
      "I",
      handsDetected[hand][16].x * handFootage.width,
      handsDetected[hand][16].y * handFootage.height + 10
    );
    p5.pop();

    p5.push();
    p5.ellipseMode(p5.CENTER);
    p5.ellipse(
      handsDetected[hand][20].x * handFootage.width,
      handsDetected[hand][20].y * handFootage.height,
      40,
      40
    );
    p5.fill(255);
    p5.textAlign(p5.CENTER);
    p5.fill(0);
    p5.textSize(32);
    p5.text(
      "M",
      handsDetected[hand][20].x * handFootage.width,
      handsDetected[hand][20].y * handFootage.height + 10
    );
    p5.pop();
  }

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
