export class Expectation {
  private expression: any;

  constructor(expression: any) {
    this.expression = expression;
  };

  toBe(value: any): boolean {
    if (!Object.is(this.expression, value)) {
      throw new Error("Expected value " + this.expression + " to be (Object.is) " + value);
    }
    return true;
  };

  toEqual(value: any): boolean {
    if (!(this.expression === value)) {
      throw new Error("Expected value " + this.expression + " to be equal (===) " + value);
    }
    return true;
  };

  toIncludes(value: any): boolean {
    if (!this.expression.includes(value)) {
      throw new Error("Expected value " + this.expression + " to includes " + value);
    }
    return true;
  };

  arrayContaining(value: Array<unknown>): boolean {
    if (!Array.isArray(this.expression)) {
      throw new Error(
        `You must provide an array to 'arrayContaining', not '` +
        typeof this.expression +
        "'."
      );
    }

    const result = Array.isArray(value) && this.expression.every(item => value.some(other => item === other));
    if (!result) {
      throw new Error("Expected array " + this.expression + " to contains all values in " + value);
    }
    return result;
  };

  arrayEquals(value: Array<unknown>): boolean {
    if (!Array.isArray(this.expression)) {
      throw new Error(
        `You must provide an array to 'arrayEquals', not '` +
        typeof this.expression +
        "'."
      );
    }

    const result = this.expression.symmetricDifference(value).length === 0;
    if (!result) {
      throw new Error("Expected array " + this.expression + " to equals " + value);
    }
    return result;
  }
};

export const test = function (name: string, testFn: () => void) {
  console.log("================== Test : " + name);
  try {
    testFn();
    console.log("✅ Test passed");
  } catch (e) {
    console.error("❌ Test failed : " + e.message);
  }
};

export const expect = function (expression: any): Expectation {
  return new Expectation(expression);
};