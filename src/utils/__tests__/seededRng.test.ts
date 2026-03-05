import { mulberry32 } from "../seededRng";

test("same seed produces same sequence", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 100; i++) expect(a()).toBe(b());
});

test("different seeds produce different sequences", () => {
  const a = mulberry32(1);
  const b = mulberry32(2);
  const results = Array.from({ length: 10 }, () => a() === b());
  expect(results.some(eq => !eq)).toBe(true);
});

test("values are in [0, 1) range", () => {
  const rng = mulberry32(99);
  for (let i = 0; i < 1000; i++) {
    const v = rng();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  }
});
