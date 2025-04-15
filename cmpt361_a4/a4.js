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
  // Create a unit cube with correct positions, normals, and UVs for die texture
  this.positions = [];
  this.normals = [];
  this.uvCoords = [];
  
  // Define UV coordinates for each face based on the dice texture layout
  // Each face has two triangles (6 vertices)
  
  // Front face (+z) - Face 1 (one dot)
  this.positions.push(
    -1,-1, 1,  1,-1, 1,  1, 1, 1,
    -1,-1, 1,  1, 1, 1, -1, 1, 1
  );
  this.normals.push(0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1);
  this.uvCoords.push(
     0,0.67, 0.5,0.67, 0.5,1,
    0,0.67, 0.5,1, 0,1
  );
  
  // Back face (-z) - Face 6 (six dots)
  this.positions.push(
     1,-1,-1, -1,-1,-1, -1, 1,-1,
     1,-1,-1, -1, 1,-1,  1, 1,-1
  );
  this.normals.push(0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1);
  this.uvCoords.push(
     0.5,0, 1,0, 1,0.33,
    0.5,0, 1,0.33, 0.5,0.33
  );
  
  // Right face (+x) - Face 2 (two dots)
  this.positions.push(
     1,-1, 1,  1,-1,-1,  1, 1,-1,
     1,-1, 1,  1, 1,-1,  1, 1, 1
  );
  this.normals.push(1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0);
  this.uvCoords.push(
     0,0.33, 0.5,0.33, 0.5,0.67,
    0,0.33, 0.5,0.67, 0,0.67
  );
  
  // Left face (-x) - Face 5 (five dots)
  this.positions.push(
    -1,-1,-1, -1,-1, 1, -1, 1, 1,
    -1,-1,-1, -1, 1, 1, -1, 1,-1
  );
  this.normals.push(-1,0,0, -1,0,0, -1,0,0, -1,0,0, -1,0,0, -1,0,0);
  this.uvCoords.push(
    0.5,0.33, 1,0.33, 1,0.67,
    0.5,0.33, 1,0.67, 0.5,0.67
  );
  
  // Top face (+y) - Face 3 (three dots)
  this.positions.push(
    -1, 1, 1,  1, 1, 1,  1, 1,-1,
    -1, 1, 1,  1, 1,-1, -1, 1,-1
  );
  this.normals.push(0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0);
  this.uvCoords.push(
    0,0, 0.5,0, 0.5,0.33,
    0,0, 0.5,0.33, 0,0.33
  );
  
  // Bottom face (-y) - Face 4 (four dots)
  this.positions.push(
    -1,-1,-1,  1,-1,-1,  1,-1, 1,
    -1,-1,-1,  1,-1, 1, -1,-1, 1
  );
  this.normals.push(0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0);
  this.uvCoords.push(
    0.5,0.67, 1,0.67, 1,1,
    0.5,0.67, 1,1, 0.5,1
  );
}

TriangleMesh.prototype.createSphere = function(numStacks, numSectors) {
  this.positions = [];
  this.normals = [];
  this.uvCoords = [];
  this.indices = [];
  for (let i = 0; i <= numStacks; ++i) {
    let theta = i * Math.PI / numStacks;
    let sinTheta = Math.sin(theta);
    let cosTheta = Math.cos(theta);
    for (let j = 0; j <= numSectors; ++j) {
      let phi = j * 2 * Math.PI / numSectors;
      let sinPhi = Math.sin(phi);
      let cosPhi = Math.cos(phi);
      let x = sinTheta * cosPhi;
      let y = sinTheta * sinPhi;
      let z = cosTheta;
      this.positions.push(x, y, z);
      this.normals.push(x, y, z);
      this.uvCoords.push(j / numSectors, 1 - i / numStacks);
    }
  }
  for (let i = 0; i < numStacks; ++i) {
    for (let j = 0; j < numSectors; ++j) {
      let first = i * (numSectors + 1) + j;
      let second = first + numSectors + 1;
      this.indices.push(first, second, first + 1);
      this.indices.push(second, second + 1, first + 1);
    }
  }
}

Scene.prototype.computeTransformation = function(transformSequence) {
  let overallTransform = Mat4.create();
  for (const t of transformSequence) {
    let type = t[0];
    let args = t.slice(1);
    let m;
    if (type === 'T') {
      m = Mat4.create();
      m[12] = args[0]; m[13] = args[1]; m[14] = args[2];
    } else if (type === 'S') {
      m = Mat4.create();
      m[0] = args[0]; m[5] = args[1]; m[10] = args[2];
    } else if (type === 'Rx' || type === 'Ry' || type === 'Rz') {
      let angle = args[0] * Math.PI / 180;
      m = Mat4.create();
      if (type === 'Rx') {
        m[5] = Math.cos(angle);  m[6] = Math.sin(angle);
        m[9] = -Math.sin(angle); m[10] = Math.cos(angle);
      } else if (type === 'Ry') {
        m[0] = Math.cos(angle);  m[2] = -Math.sin(angle);
        m[8] = Math.sin(angle);  m[10] = Math.cos(angle);
      } else if (type === 'Rz') {
        m[0] = Math.cos(angle);  m[1] = Math.sin(angle);
        m[4] = -Math.sin(angle); m[5] = Math.cos(angle);
      }
    } else {
      continue;
    }
    let result = Mat4.create();
    // Apply transformation in correct order (m * overallTransform)
    Mat4.multiply(result, m, overallTransform);
    overallTransform = result;
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

// Pass transformed position and normal to fragment shader
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLightPos;

void main() {
  // Transform position to world space for lighting calculations
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  
  // Transform position to view space
  vec4 viewPos = viewMatrix * worldPos;
  vPosition = viewPos.xyz;
  
  // Transform light to view space
  vLightPos = (viewMatrix * vec4(lightPosition, 1.0)).xyz;
  
  // Transform normal using the normal matrix
  vNormal = normalize(normalMatrix * normal);
  
  // Pass texture coordinates to fragment shader
  vTexCoord = uvCoord;
  
  // Output final clip-space position
  gl_Position = projectionMatrix * viewPos;
}
`;

Renderer.prototype.FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 ka, kd, ks, lightIntensity;
uniform float shininess;
uniform sampler2D uTexture;
uniform bool hasTexture;
varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLightPos;

void main() {
  // Normalize vectors
  vec3 N = normalize(vNormal);

  // Calculate light direction
  vec3 L = normalize(vLightPos - vPosition);

  // Calculate view direction (in view space, camera is at origin)
  vec3 V = normalize(-vPosition);

  // Calculate half vector for Blinn-Phong
  vec3 H = normalize(L + V);

  // Calculate lighting components
  vec3 ambient = ka * lightIntensity;

  // Diffuse (Lambertian) component
  float diffFactor = max(dot(N, L), 0.0);
  vec3 diffuse = kd * diffFactor * lightIntensity;

  // Specular (Blinn-Phong) component
  float specFactor = pow(max(dot(N, H), 0.0), shininess);
  vec3 specular = ks * specFactor * lightIntensity;

  // Combine lighting components
  vec3 color = ambient + diffuse + specular;

  // After computing 'color'
  float maxComponent = max(max(color.r, color.g), color.b);
  if (maxComponent > 1.0) {
    color /= maxComponent;
    //color /= maxComponent;
  }

  // Apply texture if available
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