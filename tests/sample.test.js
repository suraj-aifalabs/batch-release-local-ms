const { describe, test, expect } = require("@jest/globals");

describe("Math operations", () => {
    test("adds 1 + 2 to equal 3", () => {
        expect(1 + 2).toBe(3);
    });
});