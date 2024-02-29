class Particle {
    constructor(x, y, w, h, color, world) {
        let options = {
            friction: 1,
            restitution: 0,
            isStatic: true
        };

        this.h = h;
        this.w = w;

        // destructuring array
        let [r, g, b] = color;

        this.color = {
            r: r,
            g: g,
            b: b
        }

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
        fill(this.color.r, this.color.g, this.color.b)

        rect(0, 0, this.w, this.h);

        // ellipse(0, 0, this.w, this.h);
        // this.star(0, 0, 10, this.w - 3, 8);

        pop();
    }

    star(x, y, radius1, radius2, npoints) {
        let angle = TWO_PI / npoints;
        let halfAngle = angle / 2.0;
        beginShape();
        for (let a = 0; a < TWO_PI; a += angle) {
            let sx = x + cos(a) * radius2;
            let sy = y + sin(a) * radius2;
            vertex(sx, sy);
            sx = x + cos(a + halfAngle) * radius1;
            sy = y + sin(a + halfAngle) * radius1;
            vertex(sx, sy);
        }
        endShape(CLOSE);
    }
}