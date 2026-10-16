import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS,
  createState,
  fire,
  step,
  reflect,
  aimPath,
} from "../dist/engine.js";
test("all eight reference levels have achievable collection quotas", () => {
  assert.equal(LEVELS.length, 8);
  for (let i = 0; i < 8; i++) {
    let s = createState(i);
    for (let [kind, n] of Object.entries(LEVELS[i].goals))
      assert.ok(
        s.items.filter((e) => e.type === kind).length >= n,
        `level ${i + 1}: ${kind}`,
      );
  }
});
test("reflection preserves speed and mirrors the normal component", () => {
  let [vx, vy] = reflect(250, 380, 1, 0);
  assert.equal(vx, -250);
  assert.equal(vy, 380);
});
test("a shot consumes exactly one marble and rejects upward shots", () => {
  let s = createState();
  assert.equal(fire(s, 220, 50), false);
  assert.equal(s.ammo, 24);
  assert.equal(fire(s, 220, 300), true);
  assert.equal(s.ammo, 23);
  assert.equal(s.balls.length, 1);
});
test("collision damages an obstacle only once per contact and counts its collection", () => {
  let s = createState();
  s.items = [
    { ...s.items[0], type: "crate", x: 220, y: 220, hp: 2, maxHp: 2, id: 0 },
  ];
  fire(s, 220, 300);
  for (let i = 0; i < 90; i++) step(s, 1 / 240);
  assert.equal(s.items[0].hp, 1);
  assert.equal(s.collected.crate, 0);
  for (let i = 0; i < 500; i++) step(s, 1 / 240);
  assert.equal(s.items[0].hp, 0);
  assert.equal(s.collected.crate, 1);
});
test("win depends on quotas and permits leftover scenery", () => {
  let s = createState();
  s.collected = { crate: 5, pet: 1 };
  step(s, 1 / 240);
  assert.equal(s.status, "won");
  assert.ok(s.items.some((e) => e.hp > 0));
});
test("out of marbles loses only after the final ball exits", () => {
  let s = createState();
  s.ammo = 1;
  fire(s, 30, 600);
  step(s, 1 / 240);
  assert.equal(s.status, "playing");
  s.balls[0].y = 695;
  step(s, 1 / 240);
  assert.equal(s.status, "lost");
});
test("preview is finite, starts at the launcher, and reflects off a side wall", () => {
  let s = createState();
  let p = aimPath(s, 415, 200);
  assert.ok(p.length > 10);
  assert.deepEqual(p[0], [220, 91]);
  assert.ok(p.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)));
  assert.ok(p.some((point, i) => i > 1 && point[0] < p[i - 1][0]));
});
test("every level can be won with actual aimed physics within its marble budget", () => {
  for (let level = 0; level < 8; level++) {
    let s = createState(level);
    let actualShots = 0;
    while (s.status === "playing" && s.ammo > 0) {
      let candidates = s.items.filter(
        (e) =>
          e.hp > 0 &&
          e.type in s.collected &&
          s.collected[e.type] < LEVELS[level].goals[e.type],
      );
      let best = null;
      for (let target of candidates) {
        let sim = structuredClone(s);
        fire(sim, target.x, target.y);
        for (
          let j = 0;
          j < 14 * 240 && sim.balls.length && sim.status === "playing";
          j++
        )
          step(sim, 1 / 240);
        let gain =
          Object.entries(sim.collected).reduce(
            (n, [k, v]) =>
              n +
              Math.min(v, LEVELS[level].goals[k]) -
              Math.min(s.collected[k], LEVELS[level].goals[k]),
            0,
          ) *
            20 +
          sim.hits -
          s.hits;
        if (!best || gain > best.gain) best = { sim, gain, target };
      }
      assert.ok(best, `level ${level + 1} needs a target`);
      s = best.sim;
      actualShots++;
    }
    assert.equal(
      s.status,
      "won",
      `level ${level + 1} failed after ${actualShots} shots`,
    );
    assert.ok(actualShots <= LEVELS[level].shots);
  }
});
