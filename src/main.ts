import {vec2, vec3} from 'gl-matrix';
import {vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import{ gl } from './globals';

import {LSystem, Grammer} from './Lsystem';
import Drawable from './rendering/gl/Drawable';
import Model from './geometry/Model';
import { Scene } from './Scene';
import { DrawTree } from './Turtle'


// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
let screenQuad: Square;



const controls = {
  iteration: 3,
  axiom: "BF",
  angle: 45,
  leafDensity: 0.1,
  branchColor : [140, 140, 113],
  leafColor : [185, 152, 0],
  grassColor : [229, 235, 135],
  birdColor : [255, 255, 255],
};


let cylinder: Model;
var cylinderMesh: any;
var grassMesh: any;

let branchScene: Scene;
let leafScene : Scene;
let birdScene: Scene;
let grassScene: Scene;
let drawTree: DrawTree 
let lsystem: LSystem;
let grammer: Grammer;

function loadScene(axiom: string, iteration: number, angle: number, leafDensity: number){
  screenQuad = new Square(vec3.fromValues(0, 0, 0));
  screenQuad.create();

  // load tree scene
  lsystem = new LSystem(axiom, iteration);
  branchScene = new Scene();
  leafScene = new Scene();
  birdScene = new Scene();
  drawTree = new DrawTree(lsystem.expanded, branchScene, leafScene, birdScene, angle, leafDensity);
  branchScene.create();
  leafScene.create();
  birdScene.create();

  // load grass scene
  grassScene = new Scene();
  grassMesh = loadObj("./src/obj/Grass2.obj");

  let scale = 30;
  for (let x = -1 * scale; x < scale; x += 5) {
    for (let z = -1 * scale; z < scale; z += 5) {
      let grass = new Model(grassMesh, vec4.fromValues(controls.grassColor[0] / 255, controls.grassColor[1] / 255, controls.grassColor[2] / 255, 1));
      grass.scale(5, 5 * Math.random(), 5);
      let rand = Math.random();
      grass.rotate(3.14 * 2 * rand, vec3.fromValues(0, 1, 0));
      grass.translate(vec4.fromValues(x, 0, z, 1));
      grassScene.addElement(grass);
    }
  }
  grassScene.create();
}

function loadObj(dir: string): any {
  let OBJ = require('webgl-obj-loader');

  let data = readTextFile(dir);
  let mesh = new OBJ.Mesh(data);

  return mesh;
}

function readTextFile(dir: string) : string
{
  var allText
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", dir, false);
  rawFile.onreadystatechange = function ()
  {
      if(rawFile.readyState === 4)
      {
          if(rawFile.status === 200 || rawFile.status == 0)
          {
              allText = rawFile.responseText;
              return allText;
          }
      }
  }
  rawFile.send(null);
  return allText;
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  var branchColorControl = gui.addColor(controls, 'branchColor');
  var grassColorControl = gui.addColor(controls, 'grassColor');
  var leafColorControl = gui.addColor(controls, 'leafColor');
  var birdColorControl = gui.addColor(controls, 'birdColor');
  var axiomControl = gui.add(controls, 'axiom');
  var iterationControl = gui.add(controls, 'iteration', 0, 3);
  var angleControl = gui.add(controls, 'angle');
  var leafDensityControl = gui.add(controls, 'leafDensity', 0, 1);


  axiomControl.onChange(function(value : string){
    controls.axiom = value;
    loadScene(controls.axiom, controls.iteration, controls.angle, controls.leafDensity);
  });
  
  iterationControl.onChange(function(value : number){
    controls.iteration = value;
    loadScene(controls.axiom, controls.iteration, controls.angle, controls.leafDensity);
  });

  angleControl.onChange(function(value : number){
    loadScene(controls.axiom, controls.iteration, 3.14 * controls.angle / 180, controls.leafDensity);
  });

  leafDensityControl.onChange(function(value : number){
    loadScene(controls.axiom, controls.iteration, 3.14 * controls.angle / 180, controls.leafDensity);
  });


  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');

  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load branchScene
  loadScene(controls.axiom, controls.iteration, 3.14 * controls.angle / 180, controls.leafDensity);

  const camera = new Camera(vec3.fromValues(0, 60, 150), vec3.fromValues(0, 60, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  renderer.renderCol = vec4.fromValues(1, 1, 1, 1);

  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);


  const skyShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/sky-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/sky-frag.glsl')),
  ]);




  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    renderer.clear();

    skyShader.setDimension(vec2.fromValues(canvas.width, canvas.height));
    skyShader.draw(screenQuad);

    renderer.shader = lambert;
    // render tree
    renderer.renderCol = vec4.fromValues(controls.branchColor[0] / 255, controls.branchColor[1] / 255,controls.branchColor[2] / 255, 1);
    renderer.render(camera, [branchScene]);

    // render leaves
    renderer.renderCol = vec4.fromValues(controls.leafColor[0] / 255, controls.leafColor[1] / 255, controls.leafColor[2] / 255, 1);
    renderer.render(camera, [leafScene]);

    // render birds
    renderer.renderCol = vec4.fromValues(controls.birdColor[0] / 255, controls.birdColor[1] / 255,controls.birdColor[2] / 255, 1);
    renderer.render(camera, [birdScene]);

    // render grass
    renderer.renderCol = vec4.fromValues(controls.grassColor[0] / 255, controls.grassColor[1] / 255,controls.grassColor[2] / 255, 1);
    renderer.render(camera, [grassScene]);

    stats.end();
    renderer.time++;

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();

}

main();
