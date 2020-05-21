import { CubicBezierCurve3, Vector3, MathUtils } from 'three';
import { SplineSegment } from './Spline';

interface SegmentPrefab {
  curve: CubicBezierCurve3;
  bankAngles: {
    /** between 0 and 1 within this piece */
    t: number;
    /** radians representing the bank angle on the xy plane that will get turned into a normal
        via .... */
    // these are like angles of the normal which is kinda weird, in the future could be relative to
    // the x axis instead
    angle: number;
  }[];
}

const prefabs: { [key: string]: SegmentPrefab } = {
  leftTurn: {
    curve: new CubicBezierCurve3(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, -1),
      new Vector3(-1, 0, -1)
    ),
    bankAngles: [
      {
        t: 0,
        angle: 0,
      },
      {
        t: 0.4,
        angle: -MathUtils.degToRad(40),
      },
      {
        t: 0.6,
        angle: -MathUtils.degToRad(40),
      },
    ],
  },
  rightTurn: {
    curve: new CubicBezierCurve3(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, -1),
      new Vector3(1, 0, -1)
    ),
    bankAngles: [
      {
        t: 0,
        angle: 0,
      },
      {
        t: 0.4,
        angle: MathUtils.degToRad(25),
      },
      {
        t: 0.6,
        angle: MathUtils.degToRad(25),
      },
    ],
  },
  leftUTurn: {
    curve: new CubicBezierCurve3(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, -2),
      new Vector3(-2, 0, -2),
      new Vector3(-2, 0, 0)
    ),
    bankAngles: [
      {
        t: 0,
        angle: 0,
      },
      {
        t: 0.5,
        angle: -MathUtils.degToRad(45),
      },
    ],
  },
  straight: {
    curve: new CubicBezierCurve3(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, -1)
    ),
    bankAngles: [
      {
        t: 0,
        angle: 0,
      },
    ],
  },
};

export function convertPiecesToSplineSegments(
  pieces: string[]
): SplineSegment[] {
  let enterHeading = new Vector3(0, 0, -1);
  let enterPoint = new Vector3(0, 0, 0);
  // let enterPoint;
  return pieces.map((piece) => {
    // TODO
    const prefab = prefabs[piece];

    // via https://stackoverflow.com/a/33920320
    let angle = Math.atan2(
      enterHeading
        .clone()
        .cross(new Vector3(0, 0, -1))
        // xxx - a lil weirded out i had to use the negative y axis here, not sure what's
        // going on w that...
        .dot(new Vector3(0, -1, 0)),
      new Vector3(0, 0, -1).dot(enterHeading)
    );

    // TODO: why do i gotta negate angle here
    const a = prefab.curve.v0
      .clone()
      .applyAxisAngle(new Vector3(0, 1, 0), angle)
      .add(enterPoint);
    const b = prefab.curve.v1
      .clone()
      .applyAxisAngle(new Vector3(0, 1, 0), angle)
      .add(enterPoint);
    const c = prefab.curve.v2
      .clone()
      .applyAxisAngle(new Vector3(0, 1, 0), angle)
      .add(enterPoint);
    const d = prefab.curve.v3
      .clone()
      .applyAxisAngle(new Vector3(0, 1, 0), angle)
      .add(enterPoint);
    const curve = new CubicBezierCurve3(a, b, c, d);

    enterHeading = d.clone().sub(c).normalize();
    enterPoint = d;

    const normals = prefab.bankAngles.map(({ t, angle }) => {
      return {
        t,
        normal: new Vector3(0, 1, 0).applyAxisAngle(
          curve.getTangentAt(t),
          angle
        ),
      };
    });

    // add an ending normal for the last point
    normals.push({
      t: 1,
      normal: new Vector3(0, 1, 0).applyAxisAngle(curve.getTangentAt(1), 0),
    });

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
    'straight',
    // 'leftUTurn',
    // 'leftTurn',
    // 'straight',
    // 'rightTurn',
    // 'leftUTurn',
  ];

  return convertPiecesToSplineSegments(pieces);
}
