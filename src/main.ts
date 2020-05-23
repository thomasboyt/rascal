import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  MathUtils,
  Clock,
  LineSegments,
  Line,
  Material,
} from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { generatePieces, convertPiecesToSplineSegments } from './segments';
import { TwistySpline } from './Spline';
import { GUI } from 'dat.gui';

let cameraLock = false;
document.onkeydown = ({ keyCode }) => {
  if (keyCode === 32) {
    cameraLock = !cameraLock;
  }
};

class Controller {
  minScale = 0.5;
  maxScale = 1.5;
  numSegments = 20;

  scene: Scene;
  spline = new TwistySpline([]);
  renderItems: (Line | LineSegments)[] = [];
  pieces: string[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
    this.regeneratePieces();
  }

  renderSpline() {
    const { spline, scene } = this;
    for (const item of this.renderItems) {
      scene.remove(item);
      item.geometry.dispose();
      (item.material as Material).dispose();
    }
    const line = spline.renderLine();
    scene.add(line);
    const normals = spline.renderNormals();
    scene.add(...normals);
    // const mesh = spline.render();
    // scene.add(mesh);
    const wireframe = spline.renderWireframe();
    scene.add(wireframe);
    this.renderItems = [line, ...normals, wireframe];
  }

  regeneratePieces() {
    this.pieces = generatePieces(this);
    this.regenerateSpline();
  }

  regenerateSpline() {
    const segments = convertPiecesToSplineSegments(this.pieces, this);
    this.spline.reset(segments);
    this.renderSpline();
  }

  regenerateHeights() {
    this.spline.generateHeights();
    this.renderSpline();
  }
}

function init() {
  const scene = new Scene();
  const clock = new Clock();

  const renderer = new WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
  );
  camera.position.z = 1;
  camera.position.y = 1;
  camera.position.x = -1;
  camera.rotateY(MathUtils.degToRad(30));
  camera.rotateX(MathUtils.degToRad(-30));

  const controls = new FirstPersonControls(camera, renderer.domElement);
  controls.movementSpeed = 1;
  controls.lookSpeed = 0.1;

  const controller = new Controller(scene);
  const regenerateSpline = () => controller.regenerateSpline();

  const g = new GUI();

  const segmentFolder = g.addFolder('piece generation');
  segmentFolder.open();
  segmentFolder.add(controller, 'numSegments');
  segmentFolder.add(controller, 'regeneratePieces');

  const splineFolder = g.addFolder('spline generation');
  splineFolder.open();
  splineFolder.add(controller, 'minScale');
  splineFolder.add(controller, 'maxScale');
  splineFolder.add(controller, 'regenerateSpline');

  const heightFolder = g.addFolder('height generation');
  heightFolder.open();
  heightFolder
    .add(controller.spline, 'divisions')
    .onFinishChange(regenerateSpline);
  heightFolder
    .add(controller.spline, 'minDrop')
    .onFinishChange(regenerateSpline);
  heightFolder
    .add(controller.spline, 'maxDrop')
    .onFinishChange(regenerateSpline);
  heightFolder.add(controller, 'regenerateHeights');

  return function runLoop() {
    const delta = clock.getDelta();
    if (!cameraLock) {
      controls.update(delta);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(runLoop);
  };
}

export function run() {
  const runLoop = init();
  runLoop();
}
