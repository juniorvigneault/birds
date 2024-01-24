// this is a simple matterjs and p5js template with boundaries on each side
// of the screen, with a resize event that adjust the boundaries 
// when resized. There is

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

window.addEventListener('resize', (event) => {
    updateBoundaries();

});

function setup() {
    createCanvas(windowWidth, windowHeight)
    runEngine();
    getBoundarySize();
    createBoundaries();

    particles.push(new Particle(200, 200, 100, 100, 255, world))
}

function draw() {
    background(0);

    for (let i = 0; i < particles.length; i++) {
        particles[i].display();
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