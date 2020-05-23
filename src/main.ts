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
import { GUI } from 'dat.gui';

import {
  generatePieces,
  convertPiecesToSplineSegments,
  generateHeightsForSplineSegments,
} from './segments';
import { TwistySpline, SplineSegment } from './Spline';

let cameraLock = false;
document.onkeydown = ({ keyCode }) => {
  if (keyCode === 32) {
    cameraLock = !cameraLock;
  }
};

class Controller {
  minScale = 0.5;
  maxScale = 1.5;
  minDelta = 0;
  maxDelta = -1;
  numSegments = 12;

  scene: Scene;
  spline = new TwistySpline();
  renderItems: (Line | LineSegments)[] = [];
  pieces: string[] = [];
  segments: SplineSegment[] = [];

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

  /**
   * regenerates the pieces used to form the spline
   */
  regeneratePieces() {
    this.pieces = generatePieces(this);
    this.regenerateSpline();
    this.renderSpline();
  }

  /**
   * regenerates the spline's piece scales and heights
   */
  regenerateSpline() {
    this.segments = convertPiecesToSplineSegments(this.pieces, this);
    this.spline.setSegments(this.segments);
    this.renderSpline();
  }

  /**
   * just recalculates the spline with any new settings (e.g. divisions)
   */
  recalculateSpline() {
    this.spline.setSegments(this.segments);
    this.renderSpline();
  }

  /**
   * regenerate only heights along the spline
   */
  regenerateHeights() {
    this.segments = generateHeightsForSplineSegments(this.segments, this);
    this.spline.setSegments(this.segments);
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
  heightFolder.add(controller, 'minDelta');
  heightFolder.add(controller, 'maxDelta');
  heightFolder.add(controller, 'regenerateHeights');

  const calcFolder = g.addFolder('spline calculation');
  calcFolder.open();
  calcFolder.add(controller.spline, 'divisionsPerCurve');
  calcFolder.add(controller.spline, 'tension');
  calcFolder.add(controller, 'recalculateSpline');

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
