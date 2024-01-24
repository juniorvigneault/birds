class Particle {
    constructor(x, y, w, h, color, world) {
        let options = {
            friction: 1,
            restitution: 0,
            isStatic: false
        };

        this.h = h;
        this.w = w;
        this.color = color;

        this.body = Bodies.rectangle(x, y, w, h, options);
        World.add(world, this.body);

    }

    display() {
        push();
        let pos = this.body.position;
        let angle = this.body.angle;
        ellipseMode(CENTER);
        rectMode(CENTER);
        translate(pos.x, pos.y);
        rotate(angle);
        noStroke();
        // fillHsluv(321, 49, 50);
        fill(this.color)
        rect(0, 0, this.w, this.h);
        pop();
    }
}