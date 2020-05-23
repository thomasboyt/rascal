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
import { generateSegments } from './segments';
import { TwistySpline } from './Spline';
import { GUI } from 'dat.gui';

let cameraLock = false;
document.onkeydown = ({ keyCode }) => {
  if (keyCode === 32) {
    cameraLock = !cameraLock;
  }
};

function createRenderer(scene: Scene) {
  let items: (Line | LineSegments)[] = [];
  return (spline: TwistySpline) => {
    for (const item of items) {
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
    items = [line, ...normals, wireframe];
  };
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

  let segments = generateSegments();
  let spline = new TwistySpline(segments);
  const renderSpline = createRenderer(scene);
  renderSpline(spline);

  const controller = {
    regenerateSpline() {
      segments = generateSegments();
      spline = new TwistySpline(segments);
      renderSpline(spline);
    },
    regenerateHeights() {
      spline.generateHeights();
      renderSpline(spline);
    },
  };

  const g = new GUI();
  const splineFolder = g.addFolder('spline');
  splineFolder.open();
  splineFolder.add(controller, 'regenerateSpline');
  const heightFolder = g.addFolder('height');
  heightFolder.open();
  heightFolder.add(spline, 'minDrop');
  heightFolder.add(spline, 'maxDrop');
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

const runLoop = init();
runLoop();
