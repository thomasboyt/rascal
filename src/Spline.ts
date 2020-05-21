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
 *
 * Under the hood, it uses the threejs CurvePath and BezierCurve3 to hold the
 * beziers. This is the "least portable" aspect of this implementation, but I'm
 * pretty sure it's relatively easy to implement the portion I'm using.
 *
 * The curves should be defined starting from going "forward," which in
 * Three/WebGL/most GL-based things means the negative z axis. For example, a 90
 * degree right turn would start at [0, 0, 0] and end at [1, 0, -1].
 *
 * The spline also has a "width" that's just defined as the width along the x
 * axis for these pieces before rotation. This width is only used for
 * visualizing the mesh at the moment, but in the future could be used for
 * creating collision meshes.
 */
export class TwistySpline {
  curvePath: CurvePath<Vector3>;

  normals: {
    t: number;
    normal: Vector3;
  }[];

  // TODO: calculate this based on length of spline
  divisions = 100;

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
      for (const normal of normals) {
        const t = startT + scale * normal.t;
        this.normals.push({
          t,
          normal: normal.normal,
        });
      }
      // currentLength = nextLength;
    }
  }

  getNormalAt(t: number): Vector3 {
    // TODO
    // this seems like a very silly way to do this... but works for now
    // maybe there's some better way of scaling along pieces?
    const maxIdx =
      t === 0 ? 1 : this.normals.findIndex((normal) => normal.t >= t);
    const minIdx = maxIdx - 1;
    const minT = this.normals[minIdx].t;
    const maxT = this.normals[maxIdx].t;
    const minN = this.normals[minIdx].normal;
    const maxN = this.normals[maxIdx].normal;
    const localT = (t - minT) / (maxT - minT);
    return minN.clone().lerp(maxN, localT);
  }

  renderNormals(): Line[] {
    const step = 3 / this.divisions;
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

  renderLine(): Line {
    // TODO: n here should probably be calculated by something
    const geo = new Geometry().setFromPoints(
      this.curvePath.getSpacedPoints(this.divisions)
    );
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
  createTrackGeo() {
    const geo = new Geometry();

    const width = 0.1;
    const step = 1 / this.divisions;

    let idx = 0;
    for (let t = 0; t < 1; t += step) {
      const nextT = t + step > 1 ? 1 : t + step;
      const cur = this.curvePath.getPointAt(t);
      const next = this.curvePath.getPointAt(nextT);
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

  /**
   * Returns a mesh to render in the scene.
   */
  render(): Mesh {
    const geo = this.createTrackGeo();
    const mat = new MeshBasicMaterial({ color: 0xffff00 });
    return new Mesh(geo, mat);
  }

  renderWireframe() {
    const geo = this.createTrackGeo();
    const wireframe = new WireframeGeometry(geo);

    const line = new LineSegments(wireframe);
    const mat = line.material as Material;
    mat.depthTest = false;
    mat.opacity = 1;
    mat.transparent = true;

    return line;
  }
}
