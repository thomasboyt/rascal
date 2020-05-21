import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  MathUtils,
} from 'three';
import { generateSegments } from './segments';
import { TwistySpline } from './Spline';

function init() {
  const scene = new Scene();
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 0.2;
  camera.position.y = 1;
  camera.position.x = 1.1;
  camera.rotateY(MathUtils.degToRad(30));
  camera.rotateX(MathUtils.degToRad(-30));
  const renderer = new WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const segments = generateSegments();
  const spline = new TwistySpline(segments);
  const line = spline.renderLine();
  scene.add(line);
  const normals = spline.renderNormals();
  scene.add(...normals);

  return function runLoop() {
    // TODO: logic goes here
    renderer.render(scene, camera);
    requestAnimationFrame(runLoop);
  };
}

const runLoop = init();
runLoop();
