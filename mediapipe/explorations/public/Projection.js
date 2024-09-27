let socket;
let isClicked = false;
let birdImg;
let binocularsIMG;
function preload() {
  binocularsIMG = loadImage("assets/images/binoculars_white.png");
}
function setup() {
  // frameRate(10);
  createCanvas(800, 800);
  socket = io();

  socket.on("mouseState", (data) => {
    isClicked = data.isClicked;
    console.log(isClicked);
  });

  socket.on("birdImage", (data) => {
    birdImg = loadImage(data.image); // Load the base64 image
  });
}

function draw() {
  if (!isClicked) {
    background(0);
  }
  // background(0);

  //   if (isClicked) {
  //     drawCircle();
  //     console.log("clicked");
  //   }

  if (birdImg && isClicked) {
    imageMode(CENTER);
    image(birdImg, width / 2, height / 2, 500, 500);
  }
  imageMode(CENTER);
  // image(binocularsIMG, width / 2, height / 2);
}

function drawCircle() {
  fill(255, 0, 0);
  ellipse(width / 2, height / 2, 100, 100);
}
