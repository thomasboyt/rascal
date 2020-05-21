import { Vector3 } from 'three';

expect.extend({
  toEqualVector3(received: Vector3, expected: Vector3, precision: number = 2) {
    const closeEnough = (received: number, expected: number) => {
      if (this.isNot) {
        throw new Error(`"not" unsupported by this matcher`);
      }

      let pass = false;
      let expectedDiff = 0;
      let receivedDiff = 0;

      if (received === Infinity && expected === Infinity) {
        pass = true; // Infinity - Infinity is NaN
      } else if (received === -Infinity && expected === -Infinity) {
        pass = true; // -Infinity - -Infinity is NaN
      } else {
        expectedDiff = Math.pow(10, -precision) / 2;
        receivedDiff = Math.abs(expected - received);
        pass = receivedDiff < expectedDiff;
      }
      return { expectedDiff, receivedDiff, pass };
    };

    const coordinates: (keyof Vector3)[] = ['x', 'y', 'z'];
    for (const coordinate of coordinates) {
      const { expectedDiff, receivedDiff, pass } = closeEnough(
        received[coordinate] as number,
        expected[coordinate] as number
      );
      if (!pass) {
        const options = {};
        return {
          message: () =>
            this.utils.matcherHint(
              'toEqualVector3',
              undefined,
              undefined,
              options
            ) +
            '\n\n' +
            `Expected: ${coordinate} = ${this.utils.printExpected(
              expected[coordinate]
            )}\n` +
            `          Vector3(${expected.x}, ${expected.y}, ${expected.z})\n\n` +
            `Received: ${coordinate} = ${this.utils.printReceived(
              received[coordinate]
            )}\n` +
            `          Vector3(${received.x}, ${received.y}, ${received.z})`,
          pass: false,
        };
      }
    }

    return {
      message: () => ``,
      pass: true,
    };
  },
});
