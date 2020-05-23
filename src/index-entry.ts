import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  MathUtils,
  Clock,
} from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { generateSegments } from './segments';
import { TwistySpline } from './Spline';

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

  const segments = generateSegments();
  const spline = new TwistySpline(segments);
  const line = spline.renderLine();
  scene.add(line);
  const normals = spline.renderNormals();
  scene.add(...normals);
  // const mesh = spline.render();
  // scene.add(mesh);
  const wireframe = spline.renderWireframe();
  scene.add(wireframe);

  return function runLoop() {
    // TODO: logic goes here
    controls.update(clock.getDelta());
    renderer.render(scene, camera);
    requestAnimationFrame(runLoop);
  };
}

const runLoop = init();
runLoop();
