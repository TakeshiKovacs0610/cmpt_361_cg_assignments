import { Mat4 } from './math.js';
import { Parser } from './parser.js';
import { Scene } from './scene.js';
import { Renderer } from './renderer.js';
import { TriangleMesh } from './trianglemesh.js';
// DO NOT CHANGE ANYTHING ABOVE HERE

////////////////////////////////////////////////////////////////////////////////
// TODO: Implement createCube, createSphere, computeTransformation, and shaders
////////////////////////////////////////////////////////////////////////////////

// Example two triangle quad
const quad = {
  positions: [-1, -1, -1, 1, -1, -1, 1, 1, -1, -1, -1, -1, 1,  1, -1, -1,  1, -1],
  normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  uvCoords: [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]
}

TriangleMesh.prototype.createCube = function() {
  // Positions, normals, and UVs for each face of the cube
  this.positions = [];
  this.normals = [];
  this.uvCoords = [];
  
  // Front face (z=1)
  this.addFace(0, 0, 1, 0.25, 0.333, 0.5, 0.666);
  // Back face (z=-1)
  this.addFace(0, 0, -1, 0.75, 0.333, 0.5, 0.666);
  // Right face (x=1)
  this.addFace(1, 0, 0, 0.5, 0.333, 0.75, 0.666);
  // Left face (x=-1)
  this.addFace(-1, 0, 0, 0.0, 0.333, 0.25, 0.666);
  // Top face (y=1)
  this.addFace(0, 1, 0, 0.25, 0.0, 0.5, 0.333);
  // Bottom face (y=-1)
  this.addFace(0, -1, 0, 0.25, 0.666, 0.5, 1.0);
}

TriangleMesh.prototype.addFace = function(nx, ny, nz, uStart, vStart, uEnd, vEnd) {
  // Define positions for the face
  const positions = [
    -1, -1, 1,  1, -1, 1,  1, 1, 1,
    -1, -1, 1,  1, 1, 1,  -1, 1, 1
  ].map((v, i) => {
    if (i % 3 === 0) return v * Math.abs(nx) || (nx === 0 ? 1 : 0) * v;
    if (i % 3 === 1) return v * Math.abs(ny) || (ny === 0 ? 1 : 0) * v;
    return v * nz;
  });

  // Adjust positions based on face direction
  if (nx !== 0) {
    positions.forEach((val, i) => {
      if (i % 3 === 0) positions[i] = nx > 0 ? 1 : -1;
      else if (i % 3 === 2) positions[i] = positions[i] * (nx > 0 ? -1 : 1);
    });
  } else if (ny !== 0) {
    positions.forEach((val, i) => {
      if (i % 3 === 1) positions[i] = ny > 0 ? 1 : -1;
      else if (i % 3 === 2) positions[i] = positions[i] * (ny > 0 ? -1 : 1);
    });
  } else if (nz !== 0) {
    positions.forEach((val, i) => {
      if (i % 3 === 2) positions[i] = nz > 0 ? 1 : -1;
    });
  }

  this.positions.push(...positions);
  
  // Normals are the same for all vertices of the face
  for (let i = 0; i < 6; i++) {
    this.normals.push(nx, ny, nz);
  }

  // UV coordinates
  this.uvCoords.push(
    uStart, vStart,
    uEnd, vStart,
    uEnd, vEnd,
    uStart, vStart,
    uEnd, vEnd,
    uStart, vEnd
  );
}

TriangleMesh.prototype.createSphere = function(numStacks, numSectors) {
  this.positions = [];
  this.normals = [];
  this.uvCoords = [];
  this.indices = [];

  for (let i = 0; i <= numStacks; i++) {
    const theta = i * Math.PI / numStacks;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let j = 0; j <= numSectors; j++) {
      const phi = j * 2 * Math.PI / numSectors;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = sinTheta * cosPhi;
      const y = sinTheta * sinPhi;
      const z = cosTheta;

      this.positions.push(x, y, z);
      this.normals.push(x, y, z);
      this.uvCoords.push(j / numSectors, 1 - i / numStacks);
    }
  }

  for (let i = 0; i < numStacks; i++) {
    for (let j = 0; j < numSectors; j++) {
      const a = i * (numSectors + 1) + j;
      const b = a + numSectors + 1;
      this.indices.push(a, b, a + 1);
      this.indices.push(b, b + 1, a + 1);
    }
  }
}

Scene.prototype.computeTransformation = function(transformSequence) {
  let overallTransform = Mat4.create();
  
  for (const transform of transformSequence) {
    const type = transform[0];
    const args = transform.slice(1);
    let matrix;

    switch (type) {
      case 'T':
        matrix = Mat4.translation(args[0], args[1], args[2]);
        break;
      case 'Rx':
      case 'Ry':
      case 'Rz': {
        const axis = type[1];
        const angle = args[0] * Math.PI / 180;
        switch (axis) {
          case 'x': matrix = Mat4.rotationX(angle); break;
          case 'y': matrix = Mat4.rotationY(angle); break;
          case 'z': matrix = Mat4.rotationZ(angle); break;
        }
        break;
      }
      case 'S':
        matrix = Mat4.scale(args[0], args[1], args[2]);
        break;
      default:
        console.error('Unknown transform:', type);
        continue;
    }

    overallTransform = Mat4.multiply(matrix, overallTransform);
  }

  return overallTransform;
}

Renderer.prototype.VERTEX_SHADER = `
precision mediump float;
attribute vec3 position, normal;
attribute vec2 uvCoord;
uniform vec3 lightPosition;
uniform mat4 projectionMatrix, viewMatrix, modelMatrix;
uniform mat3 normalMatrix;
varying vec2 vTexCoord;
varying vec3 vViewPosition;
varying vec3 vViewNormal;
varying vec3 vLightViewPos;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vViewPosition = viewPosition.xyz;
  vViewNormal = normalize(normalMatrix * normal);
  vLightViewPos = (viewMatrix * vec4(lightPosition, 1.0)).xyz;
  vTexCoord = uvCoord;
  gl_Position = projectionMatrix * viewPosition;
}
`;

Renderer.prototype.FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 ka, kd, ks, lightIntensity;
uniform float shininess;
uniform sampler2D uTexture;
uniform bool hasTexture;
varying vec2 vTexCoord;
varying vec3 vViewPosition;
varying vec3 vViewNormal;
varying vec3 vLightViewPos;

void main() {
  vec3 N = normalize(vViewNormal);
  vec3 L = normalize(vLightViewPos - vViewPosition);
  vec3 V = normalize(-vViewPosition);
  vec3 H = normalize(L + V);
  
  vec3 ambient = ka * lightIntensity;
  vec3 diffuse = kd * lightIntensity * max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, H), 0.0), shininess);
  vec3 specular = ks * lightIntensity * spec;

  vec3 color = ambient + diffuse + specular;

  if (hasTexture) {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    color *= texColor.rgb;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

////////////////////////////////////////////////////////////////////////////////
// EXTRA CREDIT: change DEF_INPUT to create something interesting!
////////////////////////////////////////////////////////////////////////////////
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
].join("\n");

// DO NOT CHANGE ANYTHING BELOW HERE
export { Parser, Scene, Renderer, DEF_INPUT };