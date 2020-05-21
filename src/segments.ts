import { CubicBezierCurve3, Vector3, Vector2 } from 'three';
import { SplineSegment } from './Spline';

interface SegmentPrefab {
  curve: CubicBezierCurve3;
  bankAngles: {
    /** between 0 and 1 within this piece */
    t: number;
    /** radians representing the bank angle on the xy plane that will get turned into a normal
        via .... */
    angle: number;
  }[];
}

const prefabs: { [key: string]: SegmentPrefab } = {
  leftTurn: {
    curve: new CubicBezierCurve3(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 1),
      new Vector3(1, 0, 1)
    ),
    // TODO
    bankAngles: [],
  },
  rightTurn: {
    curve: new CubicBezierCurve3(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 1),
      new Vector3(-1, 0, 1)
    ),
    // TODO
    bankAngles: [],
  },
  leftUTurn: {
    curve: new CubicBezierCurve3(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 2),
      new Vector3(2, 0, 2),
      new Vector3(2, 0, 0)
    ),
    // TODO
    bankAngles: [],
  },
  straight: {
    curve: new CubicBezierCurve3(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 1)
    ),
    bankAngles: [],
  },
};

export function convertPiecesToSplineSegments(
  pieces: string[]
): SplineSegment[] {
  let enterHeading = new Vector3(0, 0, 1);
  // let enterPoint;
  return pieces.map((piece) => {
    // TODO
    const prefab = prefabs[piece];
    const normals = [];

    // via https://stackoverflow.com/a/33920320
    let angle = Math.atan2(enterHeading.z, enterHeading.x) - Math.atan2(1, 0);
    if (angle < 0) {
      angle += 2 * Math.PI;
    }

    // TODO: why do i gotta rotate angle here
    const a = prefab.curve.v0
      .clone()
      .applyAxisAngle(new Vector3(0, 1, 0), -angle);
    const b = prefab.curve.v1
      .clone()
      .applyAxisAngle(new Vector3(0, 1, 0), -angle);
    const c = prefab.curve.v2
      .clone()
      .applyAxisAngle(new Vector3(0, 1, 0), -angle);
    const d = prefab.curve.v3
      .clone()
      .applyAxisAngle(new Vector3(0, 1, 0), -angle);
    const curve = new CubicBezierCurve3(a, b, c, d);

    enterHeading = d.clone().sub(c).normalize();

    return {
      // rotated curve
      curve,
      normals,
    };
  });
}

export function generateSegments(): SplineSegment[] {
  const pieces = [
    'rightTurn',
    'leftTurn',
    'straight',
    'leftUTurn',
    'rightTurn',
    'straight',
  ];

  return convertPiecesToSplineSegments(pieces);
}
