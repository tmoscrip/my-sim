export function getRandomGrey(): string {
  const base = 0x1b; // canvas background
  const steps = 10;
  const max = 0xf0; // stop before pure white

  // Generate 10 grey values evenly spaced from just above base to near white
  const greys: string[] = [];
  for (let i = 0; i < steps; i++) {
    const value = Math.round(base + ((max - base) / (steps - 1)) * i);
    const hex = value.toString(16).padStart(2, "0");
    greys.push(`#${hex}${hex}${hex}`);
  }

  const randomIndex = Math.floor(Math.random() * greys.length);
  return greys[randomIndex];
}
