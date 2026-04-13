// Minimal Perlin-like smooth noise using sine harmonics
// Good enough for game feel, no dependencies needed
export class SmoothNoise {
  private offset: number;

  constructor(seed = Math.random() * 1000) {
    this.offset = seed;
  }

  // Returns value in [-1, 1], smoothly varying with t
  get(t: number): number {
    const s = t + this.offset;
    return (
      Math.sin(s * 0.7) * 0.5 +
      Math.sin(s * 1.3 + 1.2) * 0.3 +
      Math.sin(s * 2.9 + 2.4) * 0.2
    );
  }

  // Returns value in [min, max]
  range(t: number, min: number, max: number): number {
    const n = (this.get(t) + 1) / 2; // normalize to [0,1]
    return min + n * (max - min);
  }
}
