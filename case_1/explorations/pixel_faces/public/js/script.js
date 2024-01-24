// matter engine
let {
    Engine,
    Events,
    Runner,
    Bodies,
    Composite,
    World,
    Composites,
    MouseConstraint,
    Mouse,
    Constraint
} = Matter;

let engine;
let world;
let mouseConstraint;
// storing boundaries and particles
let boundaries = [];
let particles = [];

// boundaries initial positions
let ground = {
    x: 0,
    y: 0,
    w: 0,
    h: 150
};

let ceiling = {
    x: 0,
    y: 0,
    w: 2200,
    h: 150
};

let leftWall = {
    x: 0,
    y: 0,
    w: 150,
    h: 0
}

let rightWall = {
    x: 0,
    y: 0,
    w: 150,
    h: 0
};

let img;
let pixelation_level = 10; // Adjust the pixelation level for larger pixels
let pixelsToAdd = [];
let fakeFaceImage;

// load portrait (placeholder for now)
function preload() {
    img = loadImage("assets/images/1.jpg"); // https://thispersondoesnotexist.com/
}

window.addEventListener('resize', (event) => {
    updateBoundaries();
});

function setup() {
    createCanvas(windowWidth, windowHeight);
    pixelDensity(2);
    noStroke();
    img.resize(200, 200)
    // Matter.js setup
    runEngine();

    // Drawing Matter.js boundaries (replace this with your Matter.js code)
    let boundarySize = 10;
    boundaries.push(new Boundary(width / 2, height + boundarySize / 2, width, boundarySize, 0, world));

    // Perform pixelation on the image
    for (let x = 0; x < img.width; x += pixelation_level) {
        for (let y = 0; y < img.height; y += pixelation_level) {
            let c = img.get(x, y);
            let r = c[0];
            let g = c[1];
            let b = c[2];
            let a = c[3];

            pixelsToAdd.push({
                x: x,
                y: y,
                r: r,
                g: g,
                b: b,
                a: a
            });
        }
    }
    console.log(pixelsToAdd.length)
    // Animation: Draw pixels over time from the bottom
    drawPixelsWithDelay();
}



function drawPixelsWithDelay() {
    if (pixelsToAdd.length > 0) {
        let pixel = pixelsToAdd.pop();
        fill(pixel.r, pixel.g, pixel.b, pixel.a);
        square(pixel.x, pixel.y, pixelation_level);

        setTimeout(drawPixelsWithDelay, 10); // Set the delay to 10 milliseconds for a faster animation
    }
}

function updateBoundaries() {
    resizeCanvas(windowWidth, windowHeight);
    // adjust the size of boundaries whenever window is resized before recreating
    getBoundarySize();
    // remove and recreate boundaries when resizing window
    setTimeout(() => {
        for (let i = 0; i < boundaries.length; i++) {
            boundaries[i].removeFromWorld();
        }
        createBoundaries();
    }, 100);
}



function createBoundaries() {
    boundaries.push(new Boundary(ground.x + (ground.w / 2), ground.y + (ground.h / 2), ground.w, ground.h, 0, world));
    boundaries.push(new Boundary(leftWall.x - (leftWall.w / 2), leftWall.y + (leftWall.h / 2), leftWall.w, leftWall.h, 0, world));
    boundaries.push(new Boundary(rightWall.x + (rightWall.w / 2), rightWall.y + (rightWall.h / 2), rightWall.w, rightWall.h, 0, world));
    boundaries.push(new Boundary(ceiling.x + (ceiling.w / 2), ceiling.y - (ceiling.h / 2), ceiling.w, ceiling.h, 0, world));
}

function getBoundarySize() {
    ground.y = window.innerHeight;
    ground.w = window.innerWidth;
    leftWall.h = window.innerHeight;
    rightWall.x = window.innerWidth;
    rightWall.h = window.innerHeight;
    ceiling.w = window.innerWidth;
}

function runEngine() {
    engine = Engine.create();
    world = engine.world;
    Runner.run(engine);
}

function drawPixelsWithDelay() {
    if (pixelsToAdd.length > 0) {
        let pixel = pixelsToAdd.pop();
        fill(pixel.r, pixel.g, pixel.b, pixel.a);
        square(pixel.x, pixel.y, pixelation_level);

        setTimeout(drawPixelsWithDelay, 10); // Set the delay to 10 milliseconds for a faster animation
    }
}

function getPixels() {
    for (let x = 0; x < width; x += pixelation_level) {
        for (let y = 0; y < height; y += pixelation_level) {

            let c = img.get(x, y);
            let r = c[0];
            let g = c[1];
            let b = c[2];
            let a = c[3];

            pixelsToAdd.push({
                x: x,
                y: y,
                r: r,
                g: g,
                b: b,
                a: a
            });
        }
    }
}