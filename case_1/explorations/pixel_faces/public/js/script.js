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
let pixelation_level = 20; // Adjust the pixelation level for larger pixels
let pixelsToAdd = [];
let fakeFaceImage;
let timeToDraw = 10;
let explodingButtonContainer;
// load portrait (placeholder for now)
function preload() {
    loadNewFace();
    // explodingButtonContainer = document.querySelector('.button-container');
}

window.addEventListener('resize', (event) => {
    updateBoundaries();
});

function setup() {
    createCanvas(windowWidth, windowHeight);
    pixelDensity(2);
    noStroke();
    img.resize(500, 500);
    // Matter.js setup
    runEngine();

    // Drawing Matter.js boundaries (replace this with your Matter.js code)
    updateBoundaries();
    // boundaries.push(new Boundary(width / 2, height + boundarySize / 2, width, boundarySize, 0, world));

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
    // Animation: Draw pixels over time from the bottom
    drawPixelsWithDelay();

    // setInterval(loadNewFace, 10000)
    // positionExplodeButton();
}

function draw() {
    background(250, 218, 221)
    for (let i = 0; i < particles.length; i++) {
        particles[i].display();
    }

    if (pixelsToAdd.length <= 0) {
        setTimeout(() => {
            engine.gravity.scale = 0.001
        }, 2000);

    }

}

function drawPixelsWithDelay() {
    if (pixelsToAdd.length > 0) {
        // Shuffle the pixelsToAdd array
        shuffleArray(pixelsToAdd);

        let pixel = pixelsToAdd.pop();
        let centerX = width / 2;
        let centerY = height / 2;

        // Adjust the starting position based on the pixelation level
        let startX = centerX - (img.width / 2) + pixel.x;
        let startY = centerY - (img.height / 2) + pixel.y;

        fill(pixel.r, pixel.g, pixel.b, pixel.a);
        // ellipse(startX, startY, pixelation_level);

        let rgb = [pixel.r, pixel.g, pixel.b]
        // particles take the RGB of picture
        particles.push(new Particle(startX, startY, pixelation_level, pixelation_level, rgb, world))
        // white particles
        // let white = [255, 255, 255]
        // particles.push(new Particle(startX, startY, pixelation_level, pixelation_level, white, world))


        setTimeout(drawPixelsWithDelay, timeToDraw); // Set the delay to 10 milliseconds for a faster animation
    }
}

// Fisher-Yates shuffle function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
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
    engine.gravity.scale = 0.001
    world = engine.world;
    Runner.run(engine);

    let mouse = Mouse.create(document.body),
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
            }
        });

    World.add(world, mouseConstraint);
}

function loadNewFace() {
    img = loadImage('/proxy-image');
}

// function positionExplodeButton() {
//     explodingButtonContainer.style.top = '200px'
// }