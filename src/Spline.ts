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

  constructor(segments: SplineSegment[]) {
    this.curvePath = new CurvePath();
    for (const segment of segments) {
      this.curvePath.add(segment.curve);
    }
  }

  /**
   * Returns a mesh to render in the scene.
   */
  // render(): Mesh {}

  renderLine(): Line {
    const geo = new Geometry().setFromPoints(this.curvePath.getPoints());
    const mat = new LineBasicMaterial({ color: 0x00ffff });
    const line = new Line(geo, mat);
    return line;
  }
}
