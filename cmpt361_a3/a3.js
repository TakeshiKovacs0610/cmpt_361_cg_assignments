import { Framebuffer } from './framebuffer.js';
import { Rasterizer } from './rasterizer.js';

Rasterizer.prototype.drawLine = function(v1, v2) {
    let [x1, y1, c1] = v1;
    let [x2, y2, c2] = v2;

    const steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
    if (steep) {
        [x1, y1, x2, y2] = [y1, x1, y2, x2];
    }
    if (x1 > x2) {
        [x1, x2] = [x2, x1];
        [y1, y2] = [y2, y1];
        [c1, c2] = [c2, c1];
    }

    const dx = x2 - x1;
    const dy = Math.abs(y2 - y1);
    const yStep = y1 < y2 ? 1 : -1;
    let error = 0;
    let y = y1;

    for (let x = x1; x <= x2; x++) {
        const t = dx === 0 ? 0 : (x - x1) / dx;
        const color = c1.map((c, i) => (1 - t) * c + t * c2[i]);
        if (steep) {
            this.setPixel(Math.floor(y), Math.floor(x), color);
        } else {
            this.setPixel(Math.floor(x), Math.floor(y), color);
        }
        error += dy;
        if (error >= dx) {
            y += yStep;
            error -= dx;
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

    const interpolateColor = (u, v, w) => [
        u * c1[0] + v * c2[0] + w * c3[0],
        u * c1[1] + v * c2[1] + w * c3[1],
        u * c1[2] + v * c2[2] + w * c3[2]
    ];

    const isEdgeTopOrLeft = (a, b, c) => {
        if (a[1] === b[1] && a[1] === Math.max(a[1], b[1], c[1])) return true;
        const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        return cross > 0; // Corrected from cross < 0 to cross > 0
    };

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const px = x + 0.5;
            const py = y + 0.5;

            const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
            if (denominator === 0) continue;

            const u = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
            const v = ((y3 - y1) * (px - x1) + (x1 - x3) * (py - y1)) / denominator;
            const w = 1 - u - v;

            if (u >= 0 && v >= 0 && w >= 0) {
                let include = true;
                if (u <= 0 || v <= 0 || w <= 0) {
                    include = false;
                    if (u <= 0) {
                        include = isEdgeTopOrLeft([x2, y2], [x3, y3], [x1, y1]);
                    } else if (v <= 0) {
                        include = isEdgeTopOrLeft([x1, y1], [x3, y3], [x2, y2]);
                    } else if (w <= 0) {
                        include = isEdgeTopOrLeft([x1, y1], [x2, y2], [x3, y3]);
                    }
                }
                if (include) {
                    this.setPixel(x, y, interpolateColor(u, v, w));
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