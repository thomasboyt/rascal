import { Vector3 } from 'three';
declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualVector3(expected: Vector3, precision?: number): R;
    }
  }
}
