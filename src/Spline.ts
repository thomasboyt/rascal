import {
  Vector3,
  Mesh,
  CubicBezierCurve3,
  CurvePath,
  Line,
  LineBasicMaterial,
  Geometry,
  MeshBasicMaterial,
  Face3,
  LineSegments,
  WireframeGeometry,
  Material,
  CatmullRomCurve3,
  MathUtils,
} from 'three';

export interface SplineSegment {
  curve: CubicBezierCurve3;
  normals: {
    t: number;
    normal: Vector3;
  }[];
  enterHeight: number;
}

/**
 * A TwistySpline is a bezier spline that's created from several inputs:
 *
 * - A series of "2D" bezier curves forming the "top-down" view of the bezier
 *   spline. These are actually defined as 3D curves on the xz plane (with y
 *   value always 0). They should always be continuous with each other, with
 *   equal entrance/exit tangents.
 *
 * - A series of normals representing "roll" along this spline. These are
 *   linearly interpolated between to generate banked turns.
 *
 * - A randomly-generated height spline, defining the amount of height change
 *   between each segment. This uses Catmull-Rom interpolation to make smooth
 *   descents with what I'm pretty sure is continuity at each point.
 *
 * The spline also has a "width" that's just defined as the width along the x
 * axis for these pieces before rotation. This width is only used for
 * visualizing the mesh at the moment, but in the future could be used for
 * creating collision meshes.
 */
export class TwistySpline {
  // parameters set from controller
  minDelta = -2;
  maxDelta = 2;
  tension = 0.5;
  divisionsPerCurve = 24;

  private divisions!: number;
  private curvePath!: CurvePath<Vector3>;
  private segments!: SplineSegment[];

  private normals!: {
    t: number;
    normal: Vector3;
  }[];

  private heights!: {
    t: number;
    height: number;
  }[];
  private heightCurve!: CatmullRomCurve3;

  setSegments(segments: SplineSegment[]) {
    this.segments = segments;
    this.divisions = segments.length * this.divisionsPerCurve;
    this.curvePath = new CurvePath();

    for (const segment of segments) {
      this.curvePath.add(segment.curve);
    }

    this.computeNormals();
    this.computeHeights();
  }

  private computeNormals() {
    this.normals = [];

    const length = this.curvePath.getLength();
    const curveLengths = this.curvePath.getCurveLengths();

    for (let i = 0; i < this.segments.length; i += 1) {
      const normals = this.segments[i].normals;
      const startT = (i === 0 ? 0 : curveLengths[i - 1]) / length;
      const endT = curveLengths[i] / length;
      const scale = endT - startT;
      for (const normal of normals) {
        const t = startT + scale * normal.t;
        this.normals.push({
          t,
          normal: normal.normal,
        });
      }
    }
  }

  private computeHeights() {
    const curvePoints = this.segments.map(({ enterHeight }, idx) => {
      return new Vector3(idx / this.segments.length, enterHeight);
    });
    curvePoints.push(
      new Vector3(1, this.segments[this.segments.length - 1].enterHeight)
    );

    this.heightCurve = new CatmullRomCurve3(
      curvePoints,
      false,
      'catmullrom',
      this.tension
    );
  }

  /**
   * height is treated as a catmull-rom spline. mostly just because of how fun
   * it is to type catmull-rom spline.
   *
   * i kept reading about these splines while looking up how to handle the
   * actual twisty spline, but figured they wouldn't be useful because they're
   * all about adapting a spline so it goes through a buncha points, and with my
   * predefined beziers i didn't want that. but it works for height!
   */
  private getHeightAt(t: number): number {
    return this.heightCurve.getPoint(t).y;
  }

  private getPositionAt(t: number): Vector3 {
    return this.curvePath.getPointAt(t).clone().setY(this.getHeightAt(t));
  }

  private getNormalAt(t: number): Vector3 {
    // TODO
    // this seems like a very silly way to do this... but works for now
    // maybe there's some better way of scaling along pieces?
    const maxIdx =
      t === 1
        ? this.normals.length - 1
        : this.normals.findIndex((normal) => normal.t > t);
    const minIdx = maxIdx - 1;
    const minT = this.normals[minIdx].t;
    const maxT = this.normals[maxIdx].t;
    const minN = this.normals[minIdx].normal;
    const maxN = this.normals[maxIdx].normal;
    const localT = (t - minT) / (maxT - minT);
    return minN.clone().lerp(maxN, localT);
  }

  renderNormals(): Line[] {
    const lines = [];
    for (let i = 0; i < this.normals.length; i += 1) {
      const { normal, t } = this.normals[i];
      const pos = this.getPositionAt(t);
      const geo = new Geometry().setFromPoints([
        pos,
        pos.clone().add(normal.clone().multiplyScalar(0.25)),
      ]);
      const mat = new LineBasicMaterial({ color: 0xffff00 });
      const line = new Line(geo, mat);
      lines.push(line);
    }

    const step = 1 / this.divisions;
    for (let t = 0; t <= 1; t += step) {
      const normal = this.getNormalAt(t);
      const pos = this.getPositionAt(t);
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

  renderLine(): Line {
    const step = 1 / this.divisions;
    const points: Vector3[] = [];
    for (let t = 0; t <= 1; t += step) {
      points.push(this.getPositionAt(t));
    }
    const geo = new Geometry().setFromPoints(points);
    const mat = new LineBasicMaterial({ color: 0x00ffff });
    const line = new Line(geo, mat);
    return line;
  }

  // we draw two triangles per step, like this:
  // ____
  // | /|
  // |/_|
  //
  // the "flat ends" are rotated so that they are along the normals of the
  // curve, as defined by the rotation of the curve + user-provided normals
  private createTrackGeo() {
    const geo = new Geometry();

    const width = 0.1;
    const step = 1 / this.divisions;

    let idx = 0;
    for (let t = 0; t < 1; t += step) {
      const nextT = t + step > 1 ? 1 : t + step;
      const cur = this.getPositionAt(t);
      const next = this.getPositionAt(nextT);
      const tangent = this.curvePath.getTangentAt(t);
      const nextTangent = this.curvePath.getTangentAt(nextT);
      const curNormal = this.getNormalAt(t);
      const nextNormal = this.getNormalAt(nextT);
      const offset = tangent.clone().cross(curNormal).multiplyScalar(width);
      const nextOffset = nextTangent
        .clone()
        .cross(nextNormal)
        .multiplyScalar(width);

      geo.vertices.push(
        // triangle one
        cur.clone().add(offset),
        next.clone().add(nextOffset),
        cur.clone().sub(offset),
        // triangle two
        cur.clone().sub(offset),
        next.clone().add(nextOffset),
        next.clone().sub(nextOffset)
      );

      geo.faces.push(new Face3(idx, idx + 1, idx + 2));
      geo.faces.push(new Face3(idx + 3, idx + 4, idx + 5));
      idx += 6;
    }

    return geo;
  }

  renderWireframe() {
    const geo = this.createTrackGeo();
    const wireframe = new WireframeGeometry(geo);

    const line = new LineSegments(wireframe);
    const mat = line.material as Material;
    mat.depthTest = false;
    mat.opacity = 0.8;
    mat.transparent = true;

    return line;
  }

  /**
   * Returns a mesh to render in the scene.
   */
  render(): Mesh {
    const geo = this.createTrackGeo();
    const mat = new MeshBasicMaterial({ color: 0xffff00 });
    return new Mesh(geo, mat);
  }
}
