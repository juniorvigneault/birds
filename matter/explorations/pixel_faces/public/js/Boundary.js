class Boundary {
  constructor(x, y, width, height, color, world) {
    // no slide or bounce friction = 1, restitution = 0
    let options = {
      friction: 0.8,
      restitution: 0.6,
      isStatic: true,
      collisionFilter: {
        mask: 0x0001
      }
    }

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.world = world;
    this.body = Bodies.rectangle(this.x, this.y, this.width, this.height, options);
    World.add(this.world, this.body);

  }

  display() {
    let pos = this.body.position;
    push();
    rectMode(CENTER);
    fill(0);
    noStroke();
    translate(pos.x, pos.y);
    rotate(this.body.angle);
    rect(0, 0, this.w, this.h);
    pop();
  }

  removeFromWorld() {
    World.remove(world, this.body);
  }
}
// export default Particle;