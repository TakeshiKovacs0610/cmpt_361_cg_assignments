import { Framebuffer } from './framebuffer.js';
import { Rasterizer } from './rasterizer.js';


// DO NOT CHANGE ANYTHING ABOVE HERE

////////////////////////////////////////////////////////////////////////////////
// TODO: Implement functions drawLine(v1, v2) and drawTriangle(v1, v2, v3) below.
////////////////////////////////////////////////////////////////////////////////

// take two vertices defining line and rasterize to framebuffer
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
        if (2 * error >= dx) {
            y += yStep;
            error -= dx;
        }
    }
};

// take 3 vertices defining a solid triangle and rasterize to framebuffer
Rasterizer.prototype.drawTriangle = function(v1, v2, v3) {
    const [x1, y1, c1] = v1;
    const [x2, y2, c2] = v2;
    const [x3, y3, c3] = v3;

    // Find bounding box of the triangle
    const minX = Math.floor(Math.min(x1, x2, x3));
    const maxX = Math.ceil(Math.max(x1, x2, x3));
    const minY = Math.floor(Math.min(y1, y2, y3));
    const maxY = Math.ceil(Math.max(y1, y2, y3));

    // Calculate triangle area (used for barycentric coordinates)
    const area = ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
    if (area === 0) return; // Skip degenerate triangles

    // Function to determine if an edge is a top or left edge
    const isTopOrLeftEdge = (x0, y0, x1, y1) => {
        // Horizontal edge, top if it's on the top
        if (y0 === y1) return x0 < x1;
        // Not horizontal, left edge if going up
        return y0 > y1;
    };

    // Precompute edge values for the top-left rule
    const edge1TopLeft = isTopOrLeftEdge(x1, y1, x2, y2);
    const edge2TopLeft = isTopOrLeftEdge(x2, y2, x3, y3);
    const edge3TopLeft = isTopOrLeftEdge(x3, y3, x1, y1);
    
    // Color interpolation function
    const interpolateColor = (w1, w2, w3) => [
        w1 * c1[0] + w2 * c2[0] + w3 * c3[0],
        w1 * c1[1] + w2 * c2[1] + w3 * c3[1],
        w1 * c1[2] + w2 * c2[2] + w3 * c3[2]
    ];

    // Scan all pixels in bounding box
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            // Use pixel center for barycentric calculation
            const px = x + 0.5;
            const py = y + 0.5;

            // Calculate barycentric coordinates
            const w1 = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / area;
            const w2 = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / area;
            const w3 = 1 - w1 - w2;

            // Check if the point is inside the triangle with top-left rule
            const isInside = 
                (w1 > 0 || (w1 === 0 && edge1TopLeft)) &&
                (w2 > 0 || (w2 === 0 && edge2TopLeft)) &&
                (w3 > 0 || (w3 === 0 && edge3TopLeft));

            if (isInside) {
                this.setPixel(x, y, interpolateColor(w1, w2, w3));
            }
        }
    }
};

////////////////////////////////////////////////////////////////////////////////
// EXTRA CREDIT: change DEF_INPUT to create something interesting!
////////////////////////////////////////////////////////////////////////////////

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

// DO NOT CHANGE ANYTHING BELOW HERE
export { Rasterizer, Framebuffer, DEF_INPUT };