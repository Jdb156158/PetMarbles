const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
(async () => {
  const { LEVELS, createState, fire, step } = await import(
    pathToFileURL(path.resolve(__dirname, "../dist/engine.js"))
  );
  const plans = [];
  for (let level = 0; level < 8; level++) {
    let s = createState(level),
      plan = [];
    while (s.status === "playing" && s.ammo > 0) {
      let targets = s.items.filter(
        (e) =>
          e.hp > 0 &&
          e.type in s.collected &&
          s.collected[e.type] < LEVELS[level].goals[e.type],
      );
      let best;
      for (let target of targets) {
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
      plan.push([best.target.x, best.target.y]);
      s = best.sim;
    }
    assert.equal(s.status, "won");
    plans.push(plan);
  }
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
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
  assert.equal(await page.locator("#ammo").innerText(), "24");
  await page.click("#hint");
  assert.ok((await page.evaluate(() => window.petMarbles.getAim())).y > 100);
  await page.click("#help-nav");
  assert.ok(await page.locator("dialog").isVisible());
  await page.click("#modal-close");
  await page.click("#collection-nav");
  assert.equal(await page.locator(".pet-card").count(), 3);
  await page.click("#modal-close");
  await page.click("#pause");
  assert.ok(
    (await page.evaluate(() => window.petMarbles.getSnapshot())).paused,
  );
  await page.click("#resume");
  await page.click("#speed");
  const shoot = async (x, y) => {
    let rect = await page.locator("#game").boundingBox();
    await page.mouse.move(
      rect.x + (220 / 440) * rect.width,
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
  for (let level = 0; level < 8; level++) {
    for (const [x, y] of plans[level]) await shoot(x, y);
    let s = await page.evaluate(() => window.petMarbles.getSnapshot());
    assert.equal(
      s.status,
      "won",
      `browser level ${level + 1}: ${JSON.stringify(s)}`,
    );
    assert.ok(await page.locator("#continue").isVisible());
    report.push({
      level: level + 1,
      shots: plans[level].length,
      status: s.status,
    });
    if (level === 0)
      await page.screenshot({
        path: path.resolve(__dirname, "../docs/win.png"),
        fullPage: true,
      });
    if (level < 7) await page.click("#continue");
  }
  await page.click("#continue");
  assert.equal(await page.locator(".level-tile:disabled").count(), 0);
  await page.click('[data-level="0"]');
  await page.reload();
  await page.clock.runFor(100);
  assert.equal(
    (await page.evaluate(() => window.petMarbles.getSnapshot())).unlocked,
    8,
  );
  await page.click("#speed");
  for (let i = 0; i < 24; i++) await shoot(220, 600);
  assert.equal(
    (await page.evaluate(() => window.petMarbles.getSnapshot())).status,
    "lost",
  );
  assert.ok(await page.locator("#retry").isVisible());
  await page.click("#retry");
  assert.equal(await page.locator("#ammo").innerText(), "24");
  await shoot(140, 260);
  await page.click("#restart");
  assert.ok(await page.locator("#confirm-restart").isVisible());
  await page.click("#cancel-restart");
  await page.click("#restart");
  await page.click("#confirm-restart");
  assert.equal(await page.locator("#ammo").innerText(), "24");
  await page.click("#levels");
  await page.click('[data-level="5"]');
  await page.clock.runFor(100);
  await page.screenshot({
    path: path.resolve(__dirname, "../docs/forest.png"),
    fullPage: true,
  });
  await page.click("#collection-nav");
  assert.equal(await page.locator(".pet-card.locked").count(), 0);
  await page.screenshot({
    path: path.resolve(__dirname, "../docs/collection.png"),
    fullPage: true,
  });
  await page.click("#modal-close");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await page.screenshot({
    path: path.resolve(__dirname, "../docs/mobile.png"),
    fullPage: true,
  });
  let overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  assert.equal(overflow, false);
  // A separate touch context proves touch pointer events reach the same launcher.
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
  assert.equal(await phone.locator(".level-tile:disabled").count(), 7);
  await phone.click("#modal-close");
  await mobile.close();
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        levels: report,
        failureRetry: true,
        restart: true,
        pause: true,
        help: true,
        collection: true,
        persistence: true,
        touch: true,
        mobileOverflow: overflow,
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
