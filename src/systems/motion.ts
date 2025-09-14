// Derived 2D motion system using heading (radians) and speed (px/s)
export function motionSystem(
  objs: Array<{ components: any }>,
  dt: number,
  w = 800,
  h = 800
) {
  for (const o of objs) {
    const comps = o?.components ?? {};
    const pos = comps.Position;
    const mot = comps.Motion;
    if (!pos || !mot) continue;

    // Integrate position from polar motion
    pos.x += Math.cos(mot.heading) * mot.speed * dt;
    pos.y += Math.sin(mot.heading) * mot.speed * dt;

    // Bounce off bounds with reflection of heading
    const r = comps.Render2D?.radius ?? 0;
    let bouncedX = false;
    let bouncedY = false;

    if (pos.x < r) {
      pos.x = r;
      bouncedX = true;
    } else if (pos.x > w - r) {
      pos.x = w - r;
      bouncedX = true;
    }

    if (pos.y < r) {
      pos.y = r;
      bouncedY = true;
    } else if (pos.y > h - r) {
      pos.y = h - r;
      bouncedY = true;
    }

    if (bouncedX) mot.heading = Math.PI - mot.heading; // reflect across Y axis
    if (bouncedY) mot.heading = -mot.heading; // reflect across X axis

    if (bouncedX || bouncedY) {
      // normalize to [0, 2π)
      const TAU = Math.PI * 2;
      mot.heading = ((mot.heading % TAU) + TAU) % TAU;
    }
  }
}
