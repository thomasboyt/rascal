import {
  Vector3,
  Mesh,
  Curve,
  CubicBezierCurve3,
  CurvePath,
  Line,
  LineBasicMaterial,
  Geometry,
} from 'three';

export interface SplineSegment {
  curve: CubicBezierCurve3;
  normals: {
    t: number;
    normal: Vector3;
  }[];
}

/**
 * A TwistySpline is a bezier spline that has defined normals.
 */
export class TwistySpline {
  curvePath: CurvePath<Vector3>;
  normals: {
    t: number;
    normal: Vector3;
  }[];

  constructor(segments: SplineSegment[]) {
    this.curvePath = new CurvePath();
    this.normals = [];

    for (const segment of segments) {
      this.curvePath.add(segment.curve);
    }

    // we need to store the normals with their t value along the curve
    const length = this.curvePath.getLength();
    const curveLengths = this.curvePath.getCurveLengths();

    // let currentLength = 0;
    for (let i = 0; i < segments.length; i += 1) {
      const normals = segments[i].normals;
      const startT = (i === 0 ? 0 : curveLengths[i - 1]) / length;
      const endT = curveLengths[i] / length;
      const scale = endT - startT;
      // console.log(minT, maxT, curveLengths[i]);
      for (const normal of normals) {
        const t = startT + scale * normal.t;
        console.log(t);
        this.normals.push({
          t,
          normal: normal.normal,
        });
      }
      // currentLength = nextLength;
    }
  }

  /**
   * Returns a mesh to render in the scene.
   */
  // render(): Mesh {}

  renderLine(): Line {
    const geo = new Geometry().setFromPoints(this.curvePath.getSpacedPoints());
    const mat = new LineBasicMaterial({ color: 0x00ffff });
    const line = new Line(geo, mat);
    return line;
  }

  getNormalAt(t: number): Vector3 {
    // TODO
    // need to interpolate cleanly.
    return new Vector3(0, 1, 0);
  }

  renderNormals(): Line[] {
    const step = 0.01;
    const lines = [];
    for (let t = 0; t <= 1; t += step) {
      const normal = this.getNormalAt(t);
      const pos = this.curvePath.getPointAt(t);
      const geo = new Geometry().setFromPoints([
        pos,
        pos.clone().add(normal.clone().multiplyScalar(0.25)),
      ]);
      const mat = new LineBasicMaterial({ color: 0x32cd32 });
      const line = new Line(geo, mat);
      lines.push(line);
    }
    return lines;
  }
}
