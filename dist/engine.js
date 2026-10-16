export const W = 440,
  H = 700,
  BALL_R = 6;
export const TYPES = {
  crate: { name: "饼干箱", color: "#f6bc72" },
  pet: { name: "泡泡灵", color: "#a5eadc" },
  plant: { name: "花芽灵", color: "#fba9b7" },
  star: { name: "星星泡泡", color: "#ffe080" },
  cake: { name: "奶油蛋糕", color: "#ffd3b4" },
  ice: { name: "冰方块", color: "#9de6ff" },
  tree: { name: "莓果树", color: "#9bd7aa" },
  leaf: { name: "叶子泡泡", color: "#b9e4b0" },
  wood: { name: "小木板", color: "#c9926b" },
  cone: { name: "甜甜螺", color: "#f5b2ca" },
};
const E = (type, x, y, hp = 1) => ({
  type,
  x,
  y,
  hp,
  maxHp: hp,
  r:
    type === "wood"
      ? 23
      : type === "tree"
        ? 23
        : type === "pet" || type === "plant"
          ? 20
          : 18,
  id: 0,
  hit: 0,
});
const row = (type, xs, y, hp = 1) => xs.map((x) => E(type, x, y, hp));
const xs = [100, 180, 260, 340];
const levels = [
  {
    name: "初遇泡泡灵",
    area: "晴空泳池",
    shots: 24,
    shape: 0,
    goals: { crate: 5, pet: 1 },
    items: [
      ...row("crate", [140, 220, 300], 260),
      E("crate", 140, 335),
      E("pet", 220, 335, 2),
      E("crate", 300, 335),
      ...row("crate", [140, 220, 300], 410),
    ],
  },
  {
    name: "花园里的回声",
    area: "晴空泳池",
    shots: 24,
    shape: 1,
    goals: { crate: 4, plant: 1, pet: 4 },
    items: [
      ...row("crate", xs, 230, 2),
      ...row("crate", [140, 300], 310),
      ...row("crate", [140, 300], 385),
      E("plant", 220, 345, 3),
      ...row("pet", xs, 470, 2),
    ],
  },
  {
    name: "星光捉迷藏",
    area: "晴空泳池",
    shots: 24,
    shape: 1,
    goals: { crate: 6, pet: 2, star: 3 },
    items: [
      E("crate", 100, 230, 2),
      E("crate", 340, 230, 2),
      E("pet", 100, 290, 2),
      E("pet", 340, 290, 2),
      ...row("crate", [180, 260], 315),
      ...row("crate", [140, 220, 300], 365),
      ...row("crate", [100, 180, 260, 340], 415),
      E("plant", 220, 385, 2),
      ...row("star", [155, 220, 285], 535, 2),
    ],
  },
  {
    name: "冰淇淋星球",
    area: "糖果海岸",
    shots: 20,
    shape: 0,
    goals: { cake: 5, star: 7, ice: 5 },
    items: [
      ...row("cake", [100, 145, 220, 295, 340], 230, 2),
      ...row("star", [125, 190, 250, 315], 295, 2),
      ...row("star", [190, 250], 355, 2),
      E("star", 220, 415, 2),
      ...row("ice", [145, 220, 295], 490, 2),
      ...row("ice", [110, 180, 250, 320], 545, 2),
    ],
  },
  {
    name: "甜心大巡游",
    area: "糖果海岸",
    shots: 20,
    shape: 1,
    goals: { cake: 6, pet: 4, star: 6 },
    items: [
      ...row("cake", [85, 355], 225, 2),
      ...row("cake", [120, 320], 275, 2),
      ...row("cake", [155, 285], 325, 2),
      ...row("cake", [190, 250], 375, 2),
      ...row("pet", xs, 440, 2),
      ...row("star", [125, 315], 505, 2),
      ...row("star", [90, 165, 275, 350], 555, 2),
    ],
  },
  {
    name: "莓果森林",
    area: "果冻花园",
    shots: 20,
    shape: 0,
    goals: { tree: 3, leaf: 6, wood: 6 },
    items: [
      ...row("tree", [95, 345], 250, 3),
      ...row("leaf", [180, 260], 265, 2),
      ...row("leaf", [140, 220, 300], 320, 2),
      E("leaf", 220, 215, 2),
      ...row("wood", [180, 260], 390, 2),
      ...row("wood", [130, 220, 310], 445, 2),
      ...row("wood", [170, 270], 500, 2),
      ...row("tree", [100, 340], 555, 3),
    ],
  },
  {
    name: "森林奇遇记",
    area: "果冻花园",
    shots: 24,
    shape: 1,
    goals: { tree: 4, pet: 5, leaf: 6 },
    items: [
      ...row("tree", [90, 350], 210, 3),
      ...row("pet", [155, 220, 285], 260, 2),
      ...row("wood", [140, 300], 310, 2),
      ...row("leaf", [100, 160, 220, 280, 340], 365, 2),
      ...row("tree", [170, 270], 425, 3),
      ...row("wood", [140, 300], 480, 2),
      ...row("pet", [100, 220, 340], 535, 2),
      ...row("leaf", [85, 355], 590, 2),
      ...row("cone", [180, 260], 590, 3),
    ],
  },
  {
    name: "最后的游乐派对",
    area: "果冻花园",
    shots: 20,
    shape: 1,
    goals: { tree: 3, crate: 6, cone: 3 },
    items: [
      ...row("crate", [110, 165, 220, 275, 330], 210, 2),
      ...row("tree", [155, 285], 270, 3),
      ...row("crate", [110, 330], 330, 2),
      ...row("cone", [100, 340], 395, 3),
      ...row("leaf", [160, 220, 280], 430, 2),
      E("tree", 220, 495, 3),
      ...row("crate", [130, 190, 250, 310], 550, 2),
      E("cone", 220, 605, 3),
    ],
  },
];
export const LEVELS = levels;
export function createState(index = 0) {
  const l = levels[index];
  return {
    level: index,
    ammo: l.shots,
    shotsUsed: 0,
    balls: [],
    items: l.items.map((e, i) => ({ ...e, id: i })),
    collected: Object.fromEntries(Object.keys(l.goals).map((k) => [k, 0])),
    status: "playing",
    hits: 0,
    combo: 0,
    bestCombo: 0,
    elapsed: 0,
  };
}
export function polygon(shape) {
  const raw = shape
    ? [
        [28, 80],
        [412, 80],
        [412, 330],
        [380, 363],
        [380, 412],
        [412, 445],
        [412, 670],
        [28, 670],
        [28, 445],
        [60, 412],
        [60, 363],
        [28, 330],
      ]
    : [
        [28, 80],
        [412, 80],
        [412, 670],
        [28, 670],
      ];
  const p = [];
  for (let i = 0; i < raw.length; i++) {
    let a = raw[(i + raw.length - 1) % raw.length],
      b = raw[i],
      c = raw[(i + 1) % raw.length],
      ab = Math.hypot(a[0] - b[0], a[1] - b[1]),
      bc = Math.hypot(c[0] - b[0], c[1] - b[1]),
      r = Math.min(26, ab / 2, bc / 2),
      entry = [
        b[0] + ((a[0] - b[0]) * r) / ab,
        b[1] + ((a[1] - b[1]) * r) / ab,
      ],
      exit = [b[0] + ((c[0] - b[0]) * r) / bc, b[1] + ((c[1] - b[1]) * r) / bc];
    for (let j = 0; j <= 4; j++) {
      let t = j / 4;
      p.push([
        (1 - t) ** 2 * entry[0] + 2 * (1 - t) * t * b[0] + t * t * exit[0],
        (1 - t) ** 2 * entry[1] + 2 * (1 - t) * t * b[1] + t * t * exit[1],
      ]);
    }
  }
  return p;
}
export function walls(shape) {
  let p = polygon(shape);
  return p
    .map((a, i) => ({ a, b: p[(i + 1) % p.length] }))
    .filter((e) => !(e.a[1] === 670 && e.b[1] === 670));
}
export function reflect(vx, vy, nx, ny) {
  let d = vx * nx + vy * ny;
  return [vx - 2 * d * nx, vy - 2 * d * ny];
}
function segmentHit(ball, a, b) {
  let dx = b[0] - a[0],
    dy = b[1] - a[1],
    t = Math.max(
      0,
      Math.min(
        1,
        ((ball.x - a[0]) * dx + (ball.y - a[1]) * dy) / (dx * dx + dy * dy),
      ),
    );
  let px = a[0] + dx * t,
    py = a[1] + dy * t,
    nx = ball.x - px,
    ny = ball.y - py,
    d = Math.hypot(nx, ny);
  if (d >= BALL_R || !d) return false;
  nx /= d;
  ny /= d;
  if (ball.vx * nx + ball.vy * ny >= 0) return false;
  [ball.vx, ball.vy] = reflect(ball.vx, ball.vy, nx, ny);
  ball.x = px + nx * (BALL_R + 0.2);
  ball.y = py + ny * (BALL_R + 0.2);
  return true;
}
export function bumpers(shape) {
  return shape
    ? [
        { a: [92, 600], b: [144, 612] },
        { a: [296, 612], b: [348, 600] },
      ]
    : [];
}
export function fire(s, x, y) {
  if (s.status !== "playing" || s.ammo <= 0 || s.balls.length >= 5 || y < 100)
    return false;
  let dx = x - 220,
    dy = Math.max(65, y - 85),
    d = Math.hypot(dx, dy);
  s.balls.push({
    x: 220,
    y: 91,
    vx: (dx / d) * 470,
    vy: (dy / d) * 470,
    age: 0,
    trail: [],
    contacts: new Set(),
  });
  s.ammo--;
  s.shotsUsed++;
  s.combo = 0;
  return true;
}
export function goalComplete(s) {
  return Object.entries(levels[s.level].goals).every(
    ([k, n]) => s.collected[k] >= n,
  );
}
export function step(s, dt, onEvent = () => {}) {
  if (s.status !== "playing") return;
  s.elapsed += dt;
  const geometry = walls(levels[s.level].shape),
    bumps = bumpers(levels[s.level].shape);
  for (const b of s.balls) {
    b.age += dt;
    b.trail.push([b.x, b.y]);
    if (b.trail.length > 14) b.trail.shift();
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    for (const w of [...geometry, ...bumps])
      if (segmentHit(b, w.a, w.b)) onEvent({ type: "bounce", x: b.x, y: b.y });
    for (const e of s.items) {
      if (e.hp <= 0) continue;
      let dx = b.x - e.x,
        dy = b.y - e.y,
        d = Math.hypot(dx, dy),
        r = e.r + BALL_R;
      if (d >= r) {
        b.contacts.delete(e.id);
        continue;
      }
      if (b.contacts.has(e.id)) continue;
      b.contacts.add(e.id);
      let nx = dx / (d || 1),
        ny = dy / (d || 1);
      if (!d) {
        nx = 0;
        ny = -1;
      }
      b.x = e.x + nx * (r + 0.3);
      b.y = e.y + ny * (r + 0.3);
      if (b.vx * nx + b.vy * ny < 0) [b.vx, b.vy] = reflect(b.vx, b.vy, nx, ny);
      e.hp--;
      e.hit = 0.16;
      s.hits++;
      s.combo++;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      if (e.hp === 0 && e.type in s.collected) s.collected[e.type]++;
      onEvent({
        type: e.hp === 0 ? "collect" : "hit",
        kind: e.type,
        x: e.x,
        y: e.y,
        combo: s.combo,
      });
    }
  }
  s.balls = s.balls.filter((b) => b.y < 690 && b.age < 14);
  for (const e of s.items) e.hit = Math.max(0, e.hit - dt);
  if (goalComplete(s)) {
    s.status = "won";
    onEvent({ type: "won" });
  } else if (s.ammo === 0 && s.balls.length === 0) {
    s.status = "lost";
    onEvent({ type: "lost" });
  }
}
export function aimPath(s, x, y) {
  let dx = x - 220,
    dy = Math.max(65, y - 85),
    d = Math.hypot(dx, dy);
  let b = { x: 220, y: 91, vx: (dx / d) * 470, vy: (dy / d) * 470 };
  const pts = [[b.x, b.y]],
    ws = walls(levels[s.level].shape);
  for (let i = 0; i < 420; i++) {
    b.x += b.vx / 180;
    b.y += b.vy / 180;
    for (const w of [...ws, ...bumpers(levels[s.level].shape)])
      segmentHit(b, w.a, w.b);
    if (i % 5 === 0) pts.push([b.x, b.y]);
    if (
      b.y > 670 ||
      s.items.some(
        (e) => e.hp > 0 && Math.hypot(b.x - e.x, b.y - e.y) < e.r + BALL_R,
      )
    )
      break;
  }
  return pts;
}
