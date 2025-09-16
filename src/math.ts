export type Vec2 = {
  x: number;
  y: number;
};

function make(x = 0, y = 0): Vec2 {
  return { x, y };
}

function clone(a: Vec2): Vec2 {
  return { x: a.x, y: a.y };
}

function add(a: Vec2, b: Vec2, out: Vec2 = a): Vec2 {
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  return out;
}

function sub(a: Vec2, b: Vec2, out: Vec2 = a): Vec2 {
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  return out;
}

function scale(a: Vec2, s: number, out: Vec2 = a): Vec2 {
  out.x = a.x * s;
  out.y = a.y * s;
  return out;
}

function length(a: Vec2): number {
  return Math.hypot(a.x, a.y);
}

function normalize(a: Vec2, out: Vec2 = a): Vec2 {
  const len = length(a) || 1;
  out.x = a.x / len;
  out.y = a.y / len;
  return out;
}

export const vec = { make, clone, add, sub, scale, length, normalize };
