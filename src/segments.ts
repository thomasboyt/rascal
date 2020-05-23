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
        angle: MathUtils.degToRad(40),
      },
      {
        t: 0.6,
        angle: MathUtils.degToRad(40),
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
        angle: -MathUtils.degToRad(40),
      },
    ],
  },
  straight: {
    curve: new CubicBezierCurve3(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, -1 / 3),
      new Vector3(0, 0, -2 / 3),
      new Vector3(0, 0, -1)
    ),
    bankAngles: [
      {
        t: 0,
        angle: 0,
      },
    ],
  },
  // rightMidTurn: {
  //   curve: new CubicBezierCurve3(
  //     new Vector3(0, 0, 0),
  //     new Vector3(0, 0, -ep),
  //     new Vector3(0, 0, -1),
  //     new Vector3(1.5, 0, -2)
  //   ),
  //   bankAngles: [
  //     { t: 0, angle: 0 },
  //     {
  //       t: 0.3,
  //       angle: MathUtils.degToRad(15),
  //     },
  //     {
  //       t: 0.7,
  //       angle: MathUtils.degToRad(15),
  //     },
  //   ],
  // },
};

export function convertPiecesToSplineSegments(
  pieces: string[]
): SplineSegment[] {
  let enterHeading = new Vector3(0, 0, -1).normalize();
  let enterPoint = new Vector3(0, 0, 0);

  return pieces.map((piece) => {
    const prefab = prefabs[piece];

    // get the angle between (0, 0, -1) and the current heading to figure out
    // how much to rotate the piece by.
    //
    // via https://stackoverflow.com/a/33920320
    const yaw = Math.atan2(
      enterHeading
        .clone()
        .cross(new Vector3(0, 0, -1))
        // xxx - a lil weirded out i had to use the negative y axis here, not sure what's
        // going on w that...
        .dot(new Vector3(0, -1, 0)),
      new Vector3(0, 0, -1).dot(enterHeading)
    );

    const transform = (v: Vector3): Vector3 => {
      return v
        .clone()
        .applyAxisAngle(new Vector3(0, 1, 0), yaw)
        .add(enterPoint);
    };

    const a = transform(prefab.curve.v0);
    const b = transform(prefab.curve.v1);
    const c = transform(prefab.curve.v2);
    const d = transform(prefab.curve.v3);
    const curve = new CubicBezierCurve3(a, b, c, d);

    enterHeading = d.clone().sub(c).normalize();
    enterPoint = d;

    const angles = prefab.bankAngles.concat({ t: 1, angle: 0 });
    const normals = angles.map(({ t, angle }) => {
      const tan = curve.getTangentAt(t);
      const normal = new Vector3(0, 1, 0).clone().applyAxisAngle(tan, angle);
      return {
        t,
        normal,
      };
    });

    return {
      // rotated curve
      curve,
      normals,
    };
  });
}

export function generateSegments(): SplineSegment[] {
  const prefabNames = Object.keys(prefabs);
  const pieces: string[] = [];
  for (let i = 0; i < 20; i += 1) {
    const index = Math.floor(Math.random() * prefabNames.length);
    pieces.push(prefabNames[index]);
  }

  return convertPiecesToSplineSegments(pieces);
}
