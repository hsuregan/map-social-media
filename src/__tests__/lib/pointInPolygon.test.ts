import { describe, it, expect } from "vitest";
import { pointInPolygon } from "@/lib/geo";

// Unit square: (0,0), (0,1), (1,1), (1,0)
const square = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 1, lng: 1 },
  { lat: 1, lng: 0 },
];

// Triangle: (0,0), (0,4), (3,0)
const triangle = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 4 },
  { lat: 3, lng: 0 },
];

// Concave L-shape
const concave = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 2 },
  { lat: 1, lng: 2 },
  { lat: 1, lng: 1 },
  { lat: 2, lng: 1 },
  { lat: 2, lng: 0 },
];

describe("pointInPolygon", () => {
  it("returns true for a point inside a square", () => {
    expect(pointInPolygon(0.5, 0.5, square)).toBe(true);
  });

  it("returns false for a point outside a square", () => {
    expect(pointInPolygon(2, 2, square)).toBe(false);
  });

  it("returns true for a point inside a triangle", () => {
    expect(pointInPolygon(0.5, 0.5, triangle)).toBe(true);
  });

  it("returns false for a point outside a triangle", () => {
    expect(pointInPolygon(3, 3, triangle)).toBe(false);
  });

  it("returns true for a point inside the concave polygon", () => {
    expect(pointInPolygon(0.5, 0.5, concave)).toBe(true);
  });

  it("returns false for a point in the concave notch", () => {
    expect(pointInPolygon(1.5, 1.5, concave)).toBe(false);
  });

  it("returns false for an empty polygon", () => {
    expect(pointInPolygon(0, 0, [])).toBe(false);
  });

  it("returns false for a single-point polygon", () => {
    expect(pointInPolygon(0, 0, [{ lat: 0, lng: 0 }])).toBe(false);
  });
});
