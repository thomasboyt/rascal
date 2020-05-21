import { convertPiecesToSplineSegments } from '../segments';
import { Vector3 } from 'three';

describe('convertPiecesToSplineSegments', () => {
  it('works for one piece', () => {
    const result = convertPiecesToSplineSegments(['leftTurn']);
    expect(result).toHaveLength(1);
    const curve = result[0].curve;
    expect(curve.getPointAt(0)).toEqualVector3(new Vector3(0, 0, 0));
    expect(curve.getPointAt(1)).toEqualVector3(new Vector3(-1, 0, -1));
  });

  it('rotates and places pieces relative to their entry', () => {
    const result = convertPiecesToSplineSegments([
      'leftTurn',
      'leftTurn',
      'rightTurn',
      'leftUTurn',
    ]);
    expect(result).toHaveLength(4);

    const curve1 = result[0].curve;
    expect(curve1.getPointAt(0)).toEqualVector3(new Vector3(0, 0, 0));
    expect(curve1.getPointAt(1)).toEqualVector3(new Vector3(-1, 0, -1));

    const curve2 = result[1].curve;
    expect(curve2.getPointAt(0)).toEqualVector3(new Vector3(-1, 0, -1));
    expect(curve2.getPointAt(1)).toEqualVector3(new Vector3(-2, 0, 0));

    const curve3 = result[2].curve;
    expect(curve3.getPointAt(0)).toEqualVector3(new Vector3(-2, 0, 0));
    expect(curve3.getPointAt(1)).toEqualVector3(new Vector3(-3, 0, 1));

    const curve4 = result[3].curve;
    expect(curve4.getPointAt(0)).toEqualVector3(new Vector3(-3, 0, 1));
    expect(curve4.getPointAt(1)).toEqualVector3(new Vector3(-3, 0, 3));
  });
});
