import { Framebuffer } from './framebuffer.js';
import { Rasterizer } from './rasterizer.js';

Rasterizer.prototype.drawLine = function(v1, v2) {
    let [x1, y1, c1] = v1;
    let [x2, y2, c2] = v2;

    const steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
    if (steep) {
        [x1, y1] = [y1, x1];
        [x2, y2] = [y2, x2];
    }
    if (x1 > x2) {
        [x1, x2] = [x2, x1];
        [y1, y2] = [y2, y1];
        [c1, c2] = [c2, c1];
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(1, Math.abs(dx), Math.abs(dy));
    const xInc = dx / steps;
    const yInc = dy / steps;

    for (let i = 0; i <= steps; i++) {
        const x = x1 + xInc * i;
        const y = y1 + yInc * i;
        const t = i / steps;
        const color = c1.map((c, idx) => (1 - t) * c + t * c2[idx]);
        if (steep) {
            this.setPixel(Math.floor(y), Math.floor(x), color);
        } else {
            this.setPixel(Math.floor(x), Math.floor(y), color);
        }
    }
};

Rasterizer.prototype.drawTriangle = function(v1, v2, v3) {
    const [x1, y1, c1] = v1;
    const [x2, y2, c2] = v2;
    const [x3, y3, c3] = v3;

    const minX = Math.floor(Math.min(x1, x2, x3));
    const maxX = Math.ceil(Math.max(x1, x2, x3));
    const minY = Math.floor(Math.min(y1, y2, y3));
    const maxY = Math.ceil(Math.max(y1, y2, y3));

    const area = (x1*(y2 - y3) + x2*(y3 - y1) + x3*(y1 - y2));
    if (area === 0) return;

    const interpolateColor = (u, v, w) => [
        u * c1[0] + v * c2[0] + w * c3[0],
        u * c1[1] + v * c2[1] + w * c3[1],
        u * c1[2] + v * c2[2] + w * c3[2]
    ];

    const isTopLeft = (ax, ay, bx, by) => {
        if (ay === by) return ax < bx;
        return by > ay;
    };

    for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
            const px = x + 0.5;
            const py = y + 0.5;

            const w1 = ((x2 - x3)*(py - y3) + (y3 - y2)*(px - x3)) / area;
            const w2 = ((x3 - x1)*(py - y1) + (y1 - y3)*(px - x1)) / area;
            const w3 = 1 - w1 - w2;

            if (w1 >= 0 && w2 >= 0 && w3 >= 0) {
                let edgeCheck = true;
                if (w1 === 0 && !isTopLeft(x2, y2, x3, y3)) edgeCheck = false;
                if (w2 === 0 && !isTopLeft(x3, y3, x1, y1)) edgeCheck = false;
                if (w3 === 0 && !isTopLeft(x1, y1, x2, y2)) edgeCheck = false;
                if (edgeCheck) {
                    this.setPixel(x, y, interpolateColor(w1, w2, w3));
                }
            }
        }
    }
};

const DEF_INPUT = [
    "v,10,10,1.0,0.0,0.0;",
    "v,52,52,0.0,1.0,0.0;",
    "v,52,10,0.0,0.0,1.0;",
    "v,10,52,1.0,1.0,1.0;",
    "t,0,1,2;",
    "t,0,3,1;",
    "v,10,10,1.0,1.0,1.0;",
    "v,10,52,0.0,0.0,0.0;",
    "v,52,52,1.0,1.0,1.0;",
    "v,52,10,0.0,0.0,0.0;",
    "l,4,5;",
    "l,5,6;",
    "l,6,7;",
    "l,7,4;"
  ].join("\n");
  

export { Rasterizer, Framebuffer, DEF_INPUT };