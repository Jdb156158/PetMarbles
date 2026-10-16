const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

(async () => {
  const { LEVELS, createState, fire, step } = await import(
    pathToFileURL(path.resolve(__dirname, "../dist/engine.js"))
  );
  const selected = [7, 8, 98, 99];
  const plans = new Map();
  for (const level of selected) {
    let s = createState(level),
      plan = [];
    while (s.status === "playing" && s.ammo > 0) {
      const targets = s.items.filter(
        (e) =>
          e.hp > 0 &&
          e.type in s.collected &&
          s.collected[e.type] < LEVELS[level].goals[e.type],
      );
      let best;
      for (const target of targets) {
        const sim = structuredClone(s);
        fire(sim, target.x, target.y);
        for (
          let j = 0;
          j < 14 * 240 && sim.balls.length && sim.status === "playing";
          j++
        )
          step(sim, 1 / 240);
        const gain =
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
      plan.push([best.target.x, best.target.y]);
      s = best.sim;
    }
    assert.equal(s.status, "won");
    plans.set(level, plan);
  }
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.goto(process.env.TEST_URL || "http://127.0.0.1:4183");
  await page.clock.runFor(100);
  await page.screenshot({
    path: path.resolve(__dirname, "../docs/preview.png"),
    fullPage: true,
  });

  // An unchanged v1 save from the eight-level release must resume at its old level,
  // retain its records and points, and expose level nine without replaying level eight.
  await page.evaluate(() =>
    localStorage.setItem(
      "pet-marbles-v1",
      JSON.stringify({
        unlocked: 7,
        current: 7,
        records: Object.fromEntries(
          Array.from({ length: 8 }, (_, i) => [i, { stars: 2, shots: 12 }]),
        ),
        pets: ["pet", "plant", "dream"],
        points: 320,
      }),
    ),
  );
  await page.reload();
  await page.clock.runFor(100);
  assert.equal(
    (await page.evaluate(() => window.petMarbles.getSnapshot())).unlocked,
    9,
  );
  const migrated = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pet-marbles-v1")),
  );
  assert.equal(migrated.points, 320);
  assert.equal(Object.keys(migrated.records).length, 8);
  await page.click("#levels");
  assert.equal(await page.locator("[data-chapter]").count(), 10);
  const allLevels = [];
  let locked = 0;
  for (let chapter = 0; chapter < 10; chapter++) {
    await page.click(`[data-chapter="${chapter}"]`);
    allLevels.push(
      ...(await page
        .locator("[data-level]")
        .evaluateAll((els) => els.map((el) => Number(el.dataset.level)))),
    );
    locked += await page.locator(".level-tile:disabled").count();
  }
  assert.deepEqual(
    allLevels,
    Array.from({ length: 100 }, (_, i) => i),
  );
  assert.equal(locked, 91);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.resolve(__dirname, "../docs/chapters-mobile.png"),
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.click("#modal-close");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.click("#speed");
  const shoot = async (x, y) => {
    const rect = await page.locator("#game").boundingBox();
    await page.mouse.move(
      rect.x + rect.width / 2,
      rect.y + (120 / 700) * rect.height,
    );
    await page.mouse.down();
    await page.mouse.move(
      rect.x + (x / 440) * rect.width,
      rect.y + (y / 700) * rect.height,
      { steps: 3 },
    );
    await page.mouse.up();
    await page.clock.runFor(5100);
  };
  const report = [];
  const win = async (level) => {
    assert.equal(
      (await page.evaluate(() => window.petMarbles.getSnapshot())).level,
      level + 1,
    );
    for (const [x, y] of plans.get(level)) await shoot(x, y);
    const s = await page.evaluate(() => window.petMarbles.getSnapshot());
    assert.equal(s.status, "won", JSON.stringify(s));
    assert.ok(await page.locator("#continue").isVisible());
    report.push({
      level: level + 1,
      shots: plans.get(level).length,
      status: s.status,
    });
    console.log(
      `Level ${level + 1}: won with ${plans.get(level).length} marbles.`,
    );
  };
  await win(7);
  assert.equal(await page.locator("#continue").innerText(), "出发，下一关 →");
  await page.click("#continue");
  await win(8);
  await page.click("#continue");
  await page.reload();
  await page.clock.runFor(100);
  assert.equal(
    (await page.evaluate(() => window.petMarbles.getSnapshot())).level,
    10,
  );
  assert.equal(
    (await page.evaluate(() => window.petMarbles.getSnapshot())).unlocked,
    10,
  );

  // Unlock late content as a test fixture; wins still require real pointer shots.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("pet-marbles-v1"));
    s.unlocked = 99;
    s.current = 98;
    localStorage.setItem("pet-marbles-v1", JSON.stringify(s));
  });
  await page.reload();
  await page.clock.runFor(100);
  await page.click("#speed");
  await win(98);
  await page.click("#continue");
  await page.clock.runFor(100);
  await page.screenshot({
    path: path.resolve(__dirname, "../docs/level-100.png"),
    fullPage: true,
  });
  await win(99);
  assert.ok(
    (await page.locator(".result-card").innerText()).includes(
      "全部 100 个关卡",
    ),
  );
  await page.click("#continue");
  assert.equal(
    await page.locator('[data-chapter="9"]').getAttribute("aria-pressed"),
    "true",
  );
  assert.ok(await page.locator('[data-level="99"]').isEnabled());
  await page.click('[data-chapter="0"]');
  await page.click('[data-level="0"]');
  await page.reload();
  assert.equal(
    (await page.evaluate(() => window.petMarbles.getSnapshot())).unlocked,
    100,
  );

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const phone = await mobile.newPage();
  phone.on("pageerror", (e) => errors.push(e.message));
  await phone.goto(process.env.TEST_URL || "http://127.0.0.1:4183");
  await phone.locator("#game").tap({ position: { x: 170, y: 200 } });
  assert.equal(await phone.locator("#ammo").innerText(), "23");
  await phone.click("#levels");
  assert.equal(await phone.locator(".level-tile:disabled").count(), 9);
  await phone.click('[data-chapter="9"]');
  assert.equal(await phone.locator(".level-tile:disabled").count(), 10);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        levels: report,
        totalLevels: allLevels.length,
        chapters: 10,
        legacySaveMigration: true,
        progression8To9: true,
        progression99To100: true,
        finalVictory: true,
        persistence: true,
        touch: true,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
