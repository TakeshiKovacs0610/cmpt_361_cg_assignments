import { Mat4 } from './math.js';
import { Parser } from './parser.js';
import { Scene } from './scene.js';
import { Renderer } from './renderer.js';
import { TriangleMesh } from './trianglemesh.js';
// DO NOT CHANGE ANYTHING ABOVE HERE

////////////////////////////////////////////////////////////////////////////////
// TODO: Implement createCube, createSphere, computeTransformation, and shaders
////////////////////////////////////////////////////////////////////////////////

// A helper function to add one face of the cube to the arrays.
// faceVertices: list of 4 vertices ([x,y,z]) in counter-clockwise order (starting with bottom-left)
// normal: the constant normal for the face (points outwards)
// uvRect: [umin, vmin, umax, vmax] for the dice texture cell for that face
function addFace(positions, normals, uvCoords, faceVertices, normal, uvRect) {
  const [umin, vmin, umax, vmax] = uvRect;
  // Two triangles: indices 0-1-2 and 0-2-3
  const order = [0, 1, 2, 0, 2, 3];
  for (let i = 0; i < order.length; i++) {
    const idx = order[i];
    positions.push(...faceVertices[idx]);
    normals.push(...normal);
    // Map each vertex to its (u,v) coordinates:
    // bottom-left vertex: (umin, vmin)
    // bottom-right vertex: (umax, vmin)
    // top-right vertex: (umax, vmax)
    // top-left vertex: (umin, vmax)
    if (idx === 0) {
      uvCoords.push(umin, vmin);
    } else if (idx === 1) {
      uvCoords.push(umax, vmin);
    } else if (idx === 2) {
      uvCoords.push(umax, vmax);
    } else if (idx === 3) {
      uvCoords.push(umin, vmax);
    }
  }
}

TriangleMesh.prototype.createCube = function() {
  // Create a unit cube with bottom-left-front corner at (-1, -1, +1)
  // and top-right-back corner at (+1, +1, -1)
  // We use 6 faces (2 triangles per face) with duplicate vertices to assign per-face normals and UVs.
  const positions = [];
  const normals = [];
  const uvCoords = [];

  // Define UV cells based on a dice texture net:
  // When unwrapped, the faces should appear as:
  //   ⚂ (top) above ⚅ (back) and ⚃ (bottom) below ⚅,
  //   with the middle row read as: ⚅ (back), ⚄ (left), ⚀ (front), ⚁ (right).
  // Here we assign the following UV ranges:
  const uvFront  = [0.5, 1/3, 0.75, 2/3];   // Face 1 (front, one dot)
  const uvRight  = [0.75, 1/3, 1.0, 2/3];     // Face 2 (right)
  const uvLeft   = [0.25, 1/3, 0.5, 2/3];      // Face 5 (left)
  const uvBack   = [0.0, 1/3, 0.25, 2/3];      // Face 6 (back)
  const uvTop    = [0.0, 2/3, 0.25, 1.0];       // Face 3 (top)
  const uvBottom = [0.0, 0.0, 0.25, 1/3];       // Face 4 (bottom)

  // Front face (Face 1): z = +1
  addFace(positions, normals, uvCoords,
    [
      [-1, -1,  1],  // bottom-left
      [ 1, -1,  1],  // bottom-right
      [ 1,  1,  1],  // top-right
      [-1,  1,  1]   // top-left
    ],
    [0, 0, 1],
    uvFront
  );

  // Right face (Face 2): x = +1
  addFace(positions, normals, uvCoords,
    [
      [ 1, -1,  1],  // bottom-front
      [ 1, -1, -1],  // bottom-back
      [ 1,  1, -1],  // top-back
      [ 1,  1,  1]   // top-front
    ],
    [1, 0, 0],
    uvRight
  );

  // Left face (Face 5): x = -1
  addFace(positions, normals, uvCoords,
    [
      [-1, -1, -1],  // bottom-back
      [-1, -1,  1],  // bottom-front
      [-1,  1,  1],  // top-front
      [-1,  1, -1]   // top-back
    ],
    [-1, 0, 0],
    uvLeft
  );

  // Back face (Face 6): z = -1
  addFace(positions, normals, uvCoords,
    [
      [ 1, -1, -1],  // bottom-right
      [-1, -1, -1],  // bottom-left
      [-1,  1, -1],  // top-left
      [ 1,  1, -1]   // top-right
    ],
    [0, 0, -1],
    uvBack
  );

  // Top face (Face 3): y = +1
  addFace(positions, normals, uvCoords,
    [
      [-1,  1,  1],  // front-left
      [ 1,  1,  1],  // front-right
      [ 1,  1, -1],  // back-right
      [-1,  1, -1]   // back-left
    ],
    [0, 1, 0],
    uvTop
  );

  // Bottom face (Face 4): y = -1
  addFace(positions, normals, uvCoords,
    [
      [ 1, -1,  1],  // front-right
      [-1, -1,  1],  // front-left
      [-1, -1, -1],  // back-left
      [ 1, -1, -1]   // back-right
    ],
    [0, -1, 0],
    uvBottom
  );

  // Store the generated arrays in the TriangleMesh object.
  this.positions = positions;
  this.normals = normals;
  this.uvCoords = uvCoords;
  // For cube (using a triangle soup) we do not need to populate indices.
};

TriangleMesh.prototype.createSphere = function(numStacks, numSectors) {
  // Generate a unit sphere centered at the origin with radius 1 using the stacks and sectors algorithm.
  const positions = [];
  const normals = [];
  const uvCoords = [];
  const indices = [];

  // Loop over stacks (from north pole to south pole) and sectors (around the sphere)
  for (let i = 0; i <= numStacks; i++) {
    let phi = i * Math.PI / numStacks; // phi in [0, π]
    let v = 1 - i / numStacks;         // v goes from 1 (north pole) to 0 (south pole)
    for (let j = 0; j <= numSectors; j++) {
      let theta = j * 2 * Math.PI / numSectors; // theta in [0, 2π]
      let u = j / numSectors;                    // u in [0, 1]
      let x = Math.sin(phi) * Math.cos(theta);
      let y = Math.cos(phi);
      let z = Math.sin(phi) * Math.sin(theta);
      positions.push(x, y, z);
      normals.push(x, y, z); // For a unit sphere, the normal is identical to the position.
      uvCoords.push(u, v);
    }
  }

  // Create indices for each stack/sector (each cell produces two triangles)
  for (let i = 0; i < numStacks; i++) {
    for (let j = 0; j < numSectors; j++) {
      let first = i * (numSectors + 1) + j;
      let second = first + numSectors + 1;
      indices.push(first, second, first + 1);
      indices.push(first + 1, second, second + 1);
    }
  }

  this.positions = positions;
  this.normals = normals;
  this.uvCoords = uvCoords;
  this.indices = indices;
};

Scene.prototype.computeTransformation = function(transformSequence) {
  // Compose the overall transformation matrix from a sequence of transformations.
  // Each transformation is provided as a string like "X,rd,Rz,75;" or "X,rd,T,-1,0,2;"
  // The transformation order (0-th first) is maintained by pre-multiplying the matrices.
  let overallTransform = Mat4.create();  // Start with the identity matrix.
  for (let i = 0; i < transformSequence.length; i++) {
    let cmd = transformSequence[i].replace(';', '');  // Remove trailing semicolon.
    let tokens = cmd.split(',');
    let op = tokens[2].trim();  // Operation: "T", "S", "Rx", "Ry", or "Rz"
    let mat;
    if (op === 'T') {
      let tx = parseFloat(tokens[3]);
      let ty = parseFloat(tokens[4]);
      let tz = parseFloat(tokens[5]);
      mat = Mat4.translation(tx, ty, tz);
    } else if (op === 'S') {
      let sx = parseFloat(tokens[3]);
      let sy = parseFloat(tokens[4]);
      let sz = parseFloat(tokens[5]);
      mat = Mat4.scaling(sx, sy, sz);
    } else if (op === 'Rx') {
      let angleDegrees = parseFloat(tokens[3]);
      let angleRadians = angleDegrees * Math.PI / 180;
      mat = Mat4.rotationX(angleRadians);
    } else if (op === 'Ry') {
      let angleDegrees = parseFloat(tokens[3]);
      let angleRadians = angleDegrees * Math.PI / 180;
      mat = Mat4.rotationY(angleRadians);
    } else if (op === 'Rz') {
      let angleDegrees = parseFloat(tokens[3]);
      let angleRadians = angleDegrees * Math.PI / 180;
      mat = Mat4.rotationZ(angleRadians);
    }
    // Multiply so that the earlier transforms are applied first:
    overallTransform = Mat4.multiply(mat, overallTransform);
  }
  return overallTransform;
};

Renderer.prototype.VERTEX_SHADER = `
precision mediump float;
attribute vec3 position, normal;
attribute vec2 uvCoord;
uniform mat4 projectionMatrix, viewMatrix, modelMatrix;
uniform mat3 normalMatrix;
varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vFragPos;
void main() {
  // Compute the world-space vertex position
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vFragPos = worldPos.xyz;
  // Transform and normalize the normal vector for correct lighting
  vNormal = normalize(normalMatrix * normal);
  // Pass the texture coordinates through to the fragment shader
  vTexCoord = uvCoord;
  // Compute the final clip-space position
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

Renderer.prototype.FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 ka, kd, ks, lightIntensity;
uniform float shininess;
uniform sampler2D uTexture;
uniform bool hasTexture;
uniform vec3 lightPosition;
uniform vec3 cameraPosition;
varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vFragPos;
void main() {
  // Ambient lighting
  vec3 ambient = ka * lightIntensity;
  
  // Diffuse (Lambertian) lighting
  vec3 norm = normalize(vNormal);
  vec3 lightDir = normalize(lightPosition - vFragPos);
  float diff = max(dot(norm, lightDir), 0.0);
  vec3 diffuse = kd * diff * lightIntensity;
  
  // Specular lighting using Blinn–Phong model
  vec3 viewDir = normalize(cameraPosition - vFragPos);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(norm, halfDir), 0.0), shininess);
  vec3 specular = ks * spec * lightIntensity;
  
  vec3 color = ambient + diffuse + specular;
  // If a texture is provided, modulate the computed color by the texture color.
  if(hasTexture) {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    color *= texColor.rgb;
  }
  gl_FragColor = vec4(color, 1.0);
}
`;

////////////////////////////////////////////////////////////////////////////////
// EXTRA CREDIT: change DEF_INPUT to create something interesting!
////////////////////////////////////////////////////////////////////////////////
// The default input sets up a scene with a camera, one light, a cube and a sphere,
// and it applies various transformations. An extra creative cube (extraCube) is added below.
const DEF_INPUT = [
  "c,myCamera,perspective,5,5,5,0,0,0,0,1,0;",
  "l,myLight,point,0,5,0,2,2,2;",
  "p,unitCube,cube;",
  "p,unitSphere,sphere,20,20;",
  "m,redDiceMat,0.3,0,0,0.7,0,0,1,1,1,15,dice.jpg;",
  "m,grnDiceMat,0,0.3,0,0,0.7,0,1,1,1,15,dice.jpg;",
  "m,bluDiceMat,0,0,0.3,0,0,0.7,1,1,1,15,dice.jpg;",
  "m,globeMat,0.3,0.3,0.3,0.7,0.7,0.7,1,1,1,5,globe.jpg;",
  "o,rd,unitCube,redDiceMat;",
  "o,gd,unitCube,grnDiceMat;",
  "o,bd,unitCube,bluDiceMat;",
  "o,gl,unitSphere,globeMat;",
  "X,rd,Rz,75;X,rd,Rx,90;X,rd,S,0.5,0.5,0.5;X,rd,T,-1,0,2;",
  "X,gd,Ry,45;X,gd,S,0.5,0.5,0.5;X,gd,T,2,0,2;",
  "X,bd,S,0.5,0.5,0.5;X,bd,Rx,90;X,bd,T,2,0,-1;",
  "X,gl,S,1.5,1.5,1.5;X,gl,Rx,90;X,gl,Ry,-150;X,gl,T,0,1.5,0;",
  // Extra creative object: an additional cube with its own rotation and translation.
  "o,extraCube,unitCube,bluDiceMat;",
  "X,extraCube,Rx,30;X,extraCube,Ry,60;X,extraCube,S,0.3,0.3,0.3;X,extraCube,T,-3,1,1;",
].join("\n");

// DO NOT CHANGE ANYTHING BELOW HERE
export { Parser, Scene, Renderer, DEF_INPUT };
