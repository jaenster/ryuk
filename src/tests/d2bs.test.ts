import {expect, test} from "./Expectation";

(() => {
  test("getBaseStat", () => {
    expect(getBaseStat("skills", 57, "reqlevel")).toBe(24)
  });

  test("getBaseStat string", () => {
    expect(getBaseStat("missiles", 12, "skill")).toBe(7)
  });

  test("getBaseStat negative", () => {
    expect(getBaseStat("gems", 50, "weaponmod1min")).toBe(-20)
  });

  test("getTableRow", () => {
    expect(getTableRow("runes", 12).t1min1).toBe(50);
  });

  test("getTableRow negative", () => {
    expect(getTableRow("runes", 12).t1min3).toBe(-3);
  });
})();