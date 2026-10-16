import {
  W,
  H,
  LEVELS,
  TYPES,
  createState,
  polygon,
  bumpers,
  fire,
  step,
  aimPath,
} from "./engine.js";
import { pet, oval, round, drawItem, drawFish, makeIcon } from "./art.js";
const $ = (id) => document.getElementById(id),
  canvas = $("game"),
  ctx = canvas.getContext("2d");
ctx.scale(canvas.width / W, canvas.height / H);
const pool = $("pool-water"),
  poolCtx = pool.getContext("2d"),
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let poolFrame,
  lastWater = -Infinity;
new ResizeObserver(() => {
  const rect = pool.parentElement.getBoundingClientRect();
  pool.width = 220;
  pool.height = Math.ceil((220 * rect.height) / rect.width);
  poolFrame = poolCtx.createImageData(pool.width, pool.height);
  for (let i = 0; i < poolFrame.data.length; i += 4) {
    poolFrame.data[i] = 233;
    poolFrame.data[i + 1] = 255;
    poolFrame.data[i + 2] = 255;
  }
  lastWater = -Infinity;
}).observe(pool.parentElement);

function drawPoolWater(now) {
  if (!poolFrame || now - lastWater < 40) return;
  lastWater = now;
  const t = reducedMotion.matches ? 0 : now / 1000;
  for (let y = 0; y < pool.height; y++) {
    const v = (y / pool.width) * 8;
    const drift =
      0.65 * Math.sin(v * 1.1 + t * 0.4) + 0.25 * Math.cos(v * 2.3 - t * 0.3);
    for (let x = 0; x < pool.width; x++) {
      const u = (x / pool.width) * 8;
      const wx = u + drift;
      const wy =
        v +
        0.65 * Math.cos(u * 1.25 - t * 0.35) +
        0.25 * Math.sin(u * 2 + t * 0.5);
      const field = Math.sin(wx * 2 + t * 0.2) + Math.sin(wy * 2 - t * 0.25);
      const cross =
        Math.sin((wx + wy) * 1.4 + t * 0.15) +
        Math.cos((wx - wy) * 1.7 - t * 0.2);
      poolFrame.data[(y * pool.width + x) * 4 + 3] =
        7 +
        105 / (1 + Math.abs(field) * 7) ** 2 +
        35 / (1 + Math.abs(cross) * 9) ** 2;
    }
  }
  poolCtx.putImageData(poolFrame, 0, 0);
}
const STORAGE = "pet-marbles-v1";
let saved;
try {
  saved = JSON.parse(localStorage.getItem(STORAGE)) || {};
} catch {
  saved = {};
}
let progress = {
  unlocked: Math.max(0, Math.min(7, Number(saved.unlocked) || 0)),
  records: saved.records || {},
  pets: saved.pets || ["pet"],
  points: Number(saved.points) || 0,
  current: Math.max(0, Math.min(7, Number(saved.current) || 0)),
};
let state = createState(Math.min(progress.current, progress.unlocked)),
  paused = false,
  fast = false,
  sound = false,
  aim = { x: 280, y: 420 },
  aiming = false,
  hintActive = false,
  particles = [],
  floats = [],
  last = 0,
  accumulator = 0,
  time = 0,
  audioCtx,
  winTimer = 0,
  toastTimer = 0,
  keyAngle = 0;
const descriptions = [
  "第一声碰撞，是快乐的开始。",
  "把藏在花园里的朋友带回家。",
  "让每一次反弹，都点亮一颗星。",
  "收集一份冰冰甜甜的小快乐。",
  "跟着甜香，开启一场大巡游。",
  "树影之间，藏着好多小惊喜。",
  "转个弯，也许就遇见新朋友。",
  "让最后一颗弹珠，落在快乐里。",
];
const tips = [
  "试试瞄准侧边墙壁，一颗弹珠也能收集好多惊喜。",
  "收腰处也会反弹；借助底部弹板，把弹珠送回目标区。",
  "星星泡泡有两点耐久，沿墙反弹可以连续命中。",
  "先打开冰块阵列，再用连锁反弹收集上面的星星。",
  "沿着蛋糕排布的斜线发射，能一口气打中好多目标。",
  "莓果树需要 3 次碰撞；叶子泡泡与木板各需要 2 次。",
  "目标多的时候也别急，优先找能连续反弹的角度。",
  "完成收集目标就能通关，不需要清空整个弹珠台。",
];
function save() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(progress));
  } catch {}
}
function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2400);
}
function tone(type) {
  if (!sound) return;
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    let o = audioCtx.createOscillator(),
      g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    let f =
      type === "collect"
        ? 660 + Math.min(state.combo, 8) * 60
        : type === "hit"
          ? 390
          : type === "won"
            ? 880
            : type === "shot"
              ? 260
              : 180;
    o.type = type === "bounce" ? "sine" : "triangle";
    o.frequency.setValueAtTime(f, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      f * 0.65,
      audioCtx.currentTime + 0.13,
    );
    g.gain.setValueAtTime(
      type === "bounce" ? 0.015 : 0.035,
      audioCtx.currentTime,
    );
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.17);
    o.start();
    o.stop(audioCtx.currentTime + 0.18);
  } catch {}
}
function resizeArt() {
  let c = $("mascot").getContext("2d");
  c.clearRect(0, 0, 600, 500);
  c.save();
  c.scale(2, 2);
  oval(c, 149, 196, 78, 11, "#749c701a");
  pet(c, 145, 125, 69, "pet", time * 0.3);
  c.save();
  c.translate(207, 156);
  c.rotate(0.25);
  oval(c, 0, 0, 21, 21, "#fff9c0");
  oval(c, -5, -7, 10, 6, "#fffdeb");
  c.restore();
  c.restore();
}
function setIcon(container, type, size = 48) {
  let icon = makeIcon(type, size);
  container.append(icon);
  return icon;
}
function renderHud() {
  const l = LEVELS[state.level];
  $("ammo").textContent = state.ammo;
  let total = 0,
    got = 0;
  for (const [type, n] of Object.entries(l.goals)) {
    let v = Math.min(n, state.collected[type] || 0);
    total += n;
    got += v;
    let row = document.querySelector(`[data-goal="${type}"]`);
    if (row) {
      row.querySelector("b").textContent = `${v} / ${n}`;
      row.querySelector(".goal-track span").style.width = `${(v / n) * 100}%`;
    }
    let hud = document.querySelector(`[data-hud="${type}"]`);
    if (hud) {
      hud.querySelector("span").textContent = v >= n ? "✓" : n - v;
      hud.classList.toggle("done", v >= n);
    }
  }
  $("goal-summary").textContent = `${got} / ${total}`;
}
function setupUi() {
  const l = LEVELS[state.level];
  document.querySelector(".local-tag").innerHTML = progress.points
    ? `<i></i> ${progress.points} 快乐积分`
    : "<i></i> 随时来一局";
  $("chapter").textContent =
    `${String(state.level + 1).padStart(2, "0")} / ${l.area}`;
  $("level-number").textContent = String(state.level + 1).padStart(2, "0");
  $("level-title").textContent = l.name;
  $("level-description").textContent = descriptions[state.level];
  $("level-tip").textContent = tips[state.level];
  $("goals").replaceChildren();
  $("hud-goals").replaceChildren();
  for (const [type, n] of Object.entries(l.goals)) {
    let row = document.createElement("div");
    row.className = "goal-row";
    row.dataset.goal = type;
    row.innerHTML = `<div class="goal-image"></div><div class="goal-info"><div>${TYPES[type].name}<b>0 / ${n}</b></div><div class="goal-track"><span style="width:0%"></span></div></div>`;
    setIcon(row.querySelector(".goal-image"), type);
    $("goals").append(row);
    let hud = document.createElement("div");
    hud.className = "hud-goal";
    hud.dataset.hud = type;
    setIcon(hud, type, 28);
    let count = document.createElement("span");
    hud.append(count);
    $("hud-goals").append(hud);
  }
  $("journey").replaceChildren();
  for (let i = 0; i < 8; i++) {
    let b = document.createElement("button");
    b.textContent = progress.records[i] ? "✓" : i + 1;
    b.className =
      i === state.level ? "current" : progress.records[i] ? "complete" : "";
    b.disabled = i > progress.unlocked;
    b.setAttribute("aria-label", `第${i + 1}关：${LEVELS[i].name}`);
    b.onclick = () => loadLevel(i);
    $("journey").append(b);
  }
  $("journey-count").textContent =
    `${String(Math.min(8, Object.keys(progress.records).length)).padStart(2, "0")} / 08`;
  let record = progress.records[state.level];
  $("best").textContent = record
    ? `${"★".repeat(record.stars)} · ${record.shots} 颗弹珠`
    : "等待你的第一颗星";
  $("board-tip").style.opacity = state.shotsUsed ? "0" : "1";
  renderHud();
}
function loadLevel(index) {
  clearTimeout(winTimer);
  state = createState(index);
  progress.current = index;
  save();
  paused = false;
  particles = [];
  floats = [];
  hintActive = false;
  aiming = false;
  $("overlay").hidden = true;
  setupUi();
  if ($("modal").open) $("modal").close();
}
function event(e) {
  if (e.type === "hit" || e.type === "collect") {
    let col = TYPES[e.kind].color;
    for (let i = 0; i < (e.type === "collect" ? 15 : 5); i++) {
      let a = Math.random() * Math.PI * 2,
        v = 40 + Math.random() * 150;
      particles.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 30,
        life: 1,
        max: 1,
        color: col,
        r: 2 + Math.random() * 3,
      });
    }
    if (e.type === "collect") {
      floats.push({ x: e.x, y: e.y, text: "+1", life: 1.2 });
      if (e.kind === "pet" || e.kind === "plant") {
        if (!progress.pets.includes(e.kind)) {
          progress.pets.push(e.kind);
          save();
          toast(`遇见新朋友：${TYPES[e.kind].name} ♡`);
        }
      }
    }
    tone(e.type);
    renderHud();
    if (e.combo >= 3 && e.combo % 3 === 0) {
      $("combo").textContent = `${e.combo} 连击 ✦`;
      $("combo").classList.remove("show");
      void $("combo").offsetWidth;
      $("combo").classList.add("show");
    }
  } else if (e.type === "won") {
    let stars =
      state.shotsUsed <= LEVELS[state.level].shots * 0.45
        ? 3
        : state.shotsUsed <= LEVELS[state.level].shots * 0.75
          ? 2
          : 1;
    progress.points += 20 + stars * 10;
    let prev = progress.records[state.level];
    progress.records[state.level] = {
      stars: Math.max(stars, prev?.stars || 0),
      shots: Math.min(state.shotsUsed, prev?.shots ?? Infinity),
    };
    progress.unlocked = Math.max(
      progress.unlocked,
      Math.min(7, state.level + 1),
    );
    if (state.level >= 4 && !progress.pets.includes("dream"))
      progress.pets.push("dream");
    save();
    for (let i = 0; i < 100; i++)
      particles.push({
        x: Math.random() * W,
        y: -Math.random() * 200,
        vx: (Math.random() - 0.5) * 100,
        vy: 80 + Math.random() * 140,
        life: 3,
        max: 3,
        color: ["#b8e5c1", "#ffdfa4", "#e7b7ca", "#c4b7e6"][i % 4],
        r: 2 + Math.random() * 3,
        confetti: true,
      });
    tone("won");
    winTimer = setTimeout(() => showResult(stars), 650);
  } else if (e.type === "lost") winTimer = setTimeout(showLoss, 500);
  else if (e.type === "bounce" && Math.random() < 0.3) tone("bounce");
}
function shoot() {
  if (paused || $("modal").open) return;
  if (fire(state, aim.x, aim.y)) {
    tone("shot");
    hintActive = false;
    $("board-tip").style.opacity = "0";
    renderHud();
    canvas.focus({ preventScroll: true });
  } else if (state.balls.length >= 5) toast("等前面的弹珠弹一会儿吧");
}
function pointer(e) {
  let rect = canvas.getBoundingClientRect();
  return {
    x: Math.round(((e.clientX - rect.left) / rect.width) * W),
    y: Math.round(((e.clientY - rect.top) / rect.height) * H),
  };
}
canvas.addEventListener("pointerdown", (e) => {
  if (state.status !== "playing" || paused || $("modal").open) return;
  let p = pointer(e);
  if (p.y < 100) return;
  e.preventDefault();
  aim = p;
  aiming = true;
  hintActive = false;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (aiming) aim = pointer(e);
});
canvas.addEventListener("pointerup", (e) => {
  if (!aiming) return;
  aim = pointer(e);
  aiming = false;
  if (aim.y >= 100) shoot();
});
canvas.addEventListener("pointercancel", () => {
  aiming = false;
});
canvas.addEventListener("keydown", (e) => {
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter"].includes(
      e.key,
    )
  )
    e.preventDefault();
  if (paused || state.status !== "playing") return;
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    keyAngle = Math.max(
      -1.15,
      Math.min(1.15, keyAngle + (e.key === "ArrowLeft" ? -0.06 : 0.06)),
    );
    aim = {
      x: 220 + Math.sin(keyAngle) * 420,
      y: 91 + Math.cos(keyAngle) * 420,
    };
    hintActive = true;
  } else if (e.key === " " || e.key === "Enter") shoot();
});
function boardPath(c) {
  let p = polygon(LEVELS[state.level].shape);
  c.beginPath();
  for (let i = 0; i < p.length; i++) i ? c.lineTo(...p[i]) : c.moveTo(...p[i]);
  c.closePath();
}
function drawBoard() {
  ctx.clearRect(0, 0, W, H);
  for (let i = 0; i < 2; i++) {
    const phase = time * 0.26 + (i ? 3.7 : 0.7);
    drawFish(
      ctx,
      220 + Math.sin(phase) * 166,
      29 + i * 22 + Math.sin(phase * 2) * 8,
      Math.atan2(16 * Math.cos(phase * 2), 166 * Math.cos(phase)),
      time + i,
      i ? "#e9ba76" : "#e69d9a",
    );
  }
  ctx.save();
  ctx.translate(0, 7);
  boardPath(ctx);
  ctx.lineJoin = "round";
  ctx.lineWidth = 22;
  ctx.strokeStyle = "#b78ca6";
  ctx.stroke();
  ctx.restore();
  boardPath(ctx);
  ctx.lineWidth = 22;
  ctx.strokeStyle = "#eab6c6";
  ctx.stroke();
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#f7cfda";
  ctx.stroke();
  let g = ctx.createLinearGradient(0, 85, W, 690);
  g.addColorStop(0, "#5a4a78");
  g.addColorStop(0.6, "#4b3d6c");
  g.addColorStop(1, "#51416f");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  boardPath(ctx);
  ctx.clip();
  for (let y = 80; y < H; y += 36)
    for (let x = 20; x < W; x += 36)
      if ((x + y) % 72 === 28) {
        ctx.fillStyle = "#ffffff03";
        ctx.fillRect(x, y, 36, 36);
      }
  ctx.strokeStyle = "#a893ba65";
  ctx.lineWidth = 2;
  boardPath(ctx);
  ctx.stroke();
  for (let x = 40; x < 410; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x - 4, 670);
    ctx.lineTo(x, 659);
    ctx.lineTo(x + 4, 670);
    ctx.fillStyle = "#bda7ca65";
    ctx.fill();
  }
  ctx.restore();
  // The little brass nozzle sits below the marble reservoir.
  ctx.save();
  ctx.translate(220, 79);
  ctx.rotate(Math.atan2(aim.x - 220, Math.max(65, aim.y - 85)) * -0.2);
  round(ctx, -12, -8, 24, 36, 11, "#8a76a3");
  ctx.strokeStyle = "#f2d4a0";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 25, 12, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#bd925f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 27, 12, 6, 0, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
  for (const b of bumpers(LEVELS[state.level].shape)) {
    ctx.save();
    ctx.translate((b.a[0] + b.b[0]) / 2, (b.a[1] + b.b[1]) / 2);
    ctx.rotate(Math.atan2(b.b[1] - b.a[1], b.b[0] - b.a[0]));
    ctx.beginPath();
    ctx.moveTo(-28, -5);
    ctx.lineTo(28, -5);
    ctx.lineTo(14, 11);
    ctx.lineTo(-14, 11);
    ctx.closePath();
    ctx.fillStyle = "#a58bbf";
    ctx.fill();
    ctx.strokeStyle = "#dfbad8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-26, -5);
    ctx.lineTo(26, -5);
    ctx.stroke();
    ctx.restore();
  }
  if ((aiming || hintActive) && state.status === "playing" && !paused) {
    let pts = aimPath(state, aim.x, aim.y);
    for (let i = 0; i < pts.length; i++) {
      let p = pts[i];
      oval(
        ctx,
        p[0],
        p[1],
        i === pts.length - 1 ? 5 : 2,
        i === pts.length - 1 ? 5 : 2,
        `rgba(255,244,211,${0.9 - (i / pts.length) * 0.55})`,
      );
    }
  }
  for (const e of state.items) {
    if (e.hp <= 0) continue;
    ctx.save();
    if (e.hit > 0) {
      ctx.translate(e.x, e.y);
      ctx.scale(1 + e.hit * 0.55, 1 + e.hit * 0.55);
      ctx.translate(-e.x, -e.y);
    }
    drawItem(ctx, e.type, e.x, e.y, e.r, time);
    if (e.maxHp > 1) {
      round(ctx, e.x - 13, e.y + e.r + 6, 26, 9, 4, "#293b3590");
      round(
        ctx,
        e.x - 11,
        e.y + e.r + 8,
        (22 * e.hp) / e.maxHp,
        5,
        3,
        "#b4d3a1",
      );
      ctx.fillStyle = "#f5f9e7";
      ctx.font = "500 6px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(e.hp, e.x, e.y + e.r + 13);
    }
    ctx.restore();
  }
  for (const b of state.balls) {
    for (let i = 0; i < b.trail.length; i++) {
      let p = b.trail[i];
      oval(
        ctx,
        p[0],
        p[1],
        (i / b.trail.length) * 3,
        (i / b.trail.length) * 3,
        `rgba(255,246,211,${(i / b.trail.length) * 0.25})`,
      );
    }
    ctx.shadowColor = "#fff5cb";
    ctx.shadowBlur = 9;
    oval(ctx, b.x, b.y, 6, 6, "#fff5d5");
    ctx.shadowBlur = 0;
    oval(ctx, b.x - 1.6, b.y - 2, 2.1, 2.1, "#fff");
  }
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    if (p.confetti) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 4);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r, p.r * 2, p.r);
      ctx.restore();
    } else oval(ctx, p.x, p.y, p.r, p.r, p.color);
  }
  ctx.globalAlpha = 1;
  for (const f of floats) {
    ctx.globalAlpha = Math.min(1, f.life);
    ctx.fillStyle = "#f3eac0";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
function animate(now) {
  let dt = Math.min((now - last) / 1000 || 0, 0.05);
  last = now;
  if (!paused && !$("modal").open) {
    time += dt;
    accumulator += dt * (fast ? 3 : 1);
    while (accumulator >= 1 / 240) {
      step(state, 1 / 240, event);
      accumulator -= 1 / 240;
    }
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!p.confetti) p.vy += 130 * dt;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const f of floats) {
      f.y -= 25 * dt;
      f.life -= dt;
    }
    floats = floats.filter((f) => f.life > 0);
  }
  drawPoolWater(now);
  drawBoard();
  if (Math.round(now / 100) % 2 === 0) resizeArt();
  requestAnimationFrame(animate);
}
function resultArt(kind = "pet") {
  let c = document.createElement("canvas");
  c.className = "result-art";
  c.width = 300;
  c.height = 230;
  let x = c.getContext("2d");
  x.scale(2, 2);
  pet(x, 75, 59, 43, kind);
  return c;
}
function showResult(stars) {
  let final = state.level === 7;
  $("overlay").innerHTML =
    `<div class="result-card"><span class="result-eyebrow">${final ? "ADVENTURE COMPLETE" : "A LITTLE WIN, A BIG SMILE"}</span><div class="art-slot"></div><h2>${final ? "奇遇圆满，快乐继续！" : "收集成功，快乐 +1！"}</h2><div class="result-stars">${Array.from({ length: 3 }, (_, i) => `<span class="${i < stars ? "" : "empty"}">★</span>`).join("")}</div><p>${final ? "你和新朋友一起走过了全部 8 个关卡。" : "又把一份小小的快乐，装进了口袋。"}</p><div class="result-stats"><span><b>${state.shotsUsed}</b>使用弹珠</span><span><b>${state.bestCombo}</b>最高连击</span><span><b>+${20 + stars * 10}</b>快乐积分</span></div><button class="primary-button" id="continue">${final ? "再逛一次奇遇岛" : "出发，下一关 →"}</button><button class="secondary-button" id="replay">再玩一次，挑战三颗星</button></div>`;
  $("overlay")
    .querySelector(".art-slot")
    .append(resultArt(state.level > 3 ? "plant" : "pet"));
  $("overlay").hidden = false;
  $("continue").onclick = () =>
    final ? showLevels() : loadLevel(state.level + 1);
  $("replay").onclick = () => loadLevel(state.level);
  setupUi();
}
function showLoss() {
  $("overlay").innerHTML =
    `<div class="result-card"><span class="result-eyebrow">EVERY SHOT IS A NEW START</span><div class="art-slot"></div><h2>差一点，再试一次吧</h2><p>换一个角度，惊喜也许就在下一次反弹里。<br>已收集 ${Object.values(state.collected).reduce((a, b) => a + b, 0)} 个目标 · 最高 ${state.bestCombo} 连击</p><button class="primary-button" id="retry">重新开始 ↻</button><button class="secondary-button" id="choose-level">看看其他关卡</button></div>`;
  $("overlay").querySelector(".art-slot").append(resultArt("dream"));
  $("overlay").hidden = false;
  $("retry").onclick = () => loadLevel(state.level);
  $("choose-level").onclick = showLevels;
}
function pauseGame() {
  if (state.status !== "playing") return;
  paused = true;
  aiming = false;
  $("overlay").innerHTML =
    `<div class="result-card"><span class="result-eyebrow">TAKE A LITTLE BREATH</span><h2>快乐暂停一下</h2><p>小伙伴们会在这里等你。</p><button class="primary-button" id="resume">继续奇遇 ▶</button><button class="secondary-button" id="pause-restart">重新开始本关</button></div>`;
  $("overlay").hidden = false;
  $("resume").onclick = () => {
    paused = false;
    $("overlay").hidden = true;
  };
  $("pause-restart").onclick = () => loadLevel(state.level);
}
function showModal(html) {
  aiming = false;
  $("modal-content").innerHTML = html;
  if (!$("modal").open) $("modal").showModal();
}
function showLevels() {
  showModal(
    `<div class="modal-eyebrow">PICK YOUR LITTLE ADVENTURE</div><h2 class="modal-title">下一站，去哪儿？</h2><p class="modal-subtitle">完成当前关卡，解锁下一份快乐。已解锁的关卡随时重玩。</p><div class="level-grid">${LEVELS.map((l, i) => `<button class="level-tile ${i === state.level ? "current" : ""}" data-level="${i}" ${i > progress.unlocked ? "disabled" : ""}><b>${i > progress.unlocked ? "⌑" : String(i + 1).padStart(2, "0")}</b><small>${l.name}</small><span>${progress.records[i] ? "★".repeat(progress.records[i].stars) : i > progress.unlocked ? "尚未解锁" : "等你出发"}</span></button>`).join("")}</div>`,
  );
  for (const el of $("modal").querySelectorAll("[data-level]"))
    el.onclick = () => loadLevel(Number(el.dataset.level));
}
function showCollection() {
  showModal(
    `<div class="modal-eyebrow">OUR ORIGINAL LITTLE FRIENDS</div><h2 class="modal-title">软乎乎的朋友们</h2><p class="modal-subtitle">每一次相遇，都值得被好好收藏。</p><div class="collection-grid">${[
      ["pet", "泡泡灵", "会把烦恼吹成小泡泡", "首次进入即相遇"],
      ["plant", "花芽灵", "头顶开着一朵好心情", "在第 2 关收集"],
      ["dream", "眠眠灵", "把星星藏进柔软的梦里", "完成第 5 关相遇"],
    ]
      .map(
        ([k, n, d, h]) =>
          `<div class="pet-card ${progress.pets.includes(k) ? "" : "locked"}" data-pet="${k}"><div></div><h3>${n}</h3><p>${d}</p><small>${progress.pets.includes(k) ? "♡ 已相遇" : h}</small></div>`,
      )
      .join(
        "",
      )}</div><p class="collection-note">三位宠物均为本游戏原创设计，造型以叶鳍、花芽和星梦为灵感。图鉴会随着你的奇遇自动解锁。<br>已经积攒了 ${progress.points} 快乐积分。</p>`,
  );
  for (const el of $("modal").querySelectorAll("[data-pet]")) {
    let c = document.createElement("canvas");
    c.width = 240;
    c.height = 240;
    let cc = c.getContext("2d");
    cc.scale(2, 2);
    pet(cc, 60, 61, 35, el.dataset.pet);
    el.querySelector("div").append(c);
  }
}
function showHelp() {
  showModal(
    `<div class="modal-eyebrow">A SMALL GUIDE TO BIG JOY</div><h2 class="modal-title">弹一下，快乐就出发</h2><div class="help-step"><span>01</span><div><h3>按住瞄准，松开发射</h3><p>在弹珠台上按住并拖动，虚线会显示第一次碰撞前的反弹路径。松开就能发射一颗弹珠。</p></div></div><div class="help-step"><span>02</span><div><h3>碰撞收集，巧用反弹</h3><p>下方小条表示剩余耐久，每次碰撞减少 1 点。墙壁和底部弹板会反弹；弹珠落入底部后消失。</p></div></div><div class="help-step"><span>03</span><div><h3>装满目标，开启下一关</h3><p>收集栏达到指定数量就过关，不必清空场地。弹珠用完且场上没有弹珠时挑战结束。用更少弹珠，收获更多星星！</p></div></div><div class="key-note">电脑：拖动鼠标 · 或点击弹珠台后 ← → 瞄准 / 空格发射<br>手机：单指拖动后松开 · 加速按钮可切换 3 倍速度<br>每颗弹珠最长停留 14 秒 · 同时最多 5 颗 · 弹珠用完也可以重试</div>`,
  );
}
$("levels").onclick = showLevels;
$("collection-nav").onclick = showCollection;
$("collection-link").onclick = showCollection;
$("help-nav").onclick = showHelp;
$("play-nav").onclick = () => {
  if ($("modal").open) $("modal").close();
  canvas.focus({ preventScroll: true });
};
$("modal-close").onclick = () => $("modal").close();
$("modal").addEventListener("click", (e) => {
  if (e.target === $("modal")) {
    let r = $("modal").getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      $("modal").close();
  }
});
$("pause").onclick = pauseGame;
$("restart").onclick = () => {
  if (state.shotsUsed === 0) {
    toast("全新的开始，瞄准快乐出发！");
    return;
  }
  if (state.status !== "playing") {
    loadLevel(state.level);
    return;
  }
  showModal(
    `<div class="modal-eyebrow">ONE MORE LITTLE ADVENTURE</div><h2 class="modal-title">重新开始这一关？</h2><p class="modal-subtitle">本关已发射 ${state.shotsUsed} 颗弹珠。重新开始会恢复全部弹珠，本关收集重新计算。</p><button class="primary-button" id="confirm-restart" style="margin-top:24px">重新开始 ↻</button><button class="secondary-button" id="cancel-restart">继续当前这一局</button>`,
  );
  $("confirm-restart").onclick = () => loadLevel(state.level);
  $("cancel-restart").onclick = () => $("modal").close();
};
$("speed").onclick = () => {
  fast = !fast;
  $("speed").innerHTML = `<span>»</span> 加速 ×${fast ? 3 : 1}`;
  $("speed").setAttribute("aria-pressed", fast);
};
$("hint").onclick = () => {
  if (state.status !== "playing" || paused) return;
  let targets = state.items.filter(
    (e) =>
      e.hp > 0 &&
      e.type in state.collected &&
      state.collected[e.type] < LEVELS[state.level].goals[e.type],
  );
  let target = targets.sort((a, b) => a.y - b.y)[0];
  if (target) {
    aim = { x: target.x, y: target.y };
    hintActive = true;
    toast("沿虚线试一试，也可以自己换个角度");
    canvas.focus({ preventScroll: true });
  }
};
$("sound").onclick = () => {
  sound = !sound;
  $("sound").setAttribute("aria-label", sound ? "关闭声音" : "开启声音");
  $("sound").title = sound ? "关闭声音" : "开启声音";
  $("sound-wave").setAttribute(
    "d",
    sound ? "M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" : "m16 9 6 6m0-6-6 6",
  );
  if (sound) tone("collect");
};
$("fullscreen").onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    toast("当前浏览器暂不支持全屏");
  }
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("modal").open && state.status === "playing") {
    if (paused) {
      paused = false;
      $("overlay").hidden = true;
    } else pauseGame();
  }
});
document.addEventListener("visibilitychange", () => {
  if (
    document.hidden &&
    state.status === "playing" &&
    !paused &&
    !$("modal").open
  )
    pauseGame();
});
setupUi();
resizeArt();
requestAnimationFrame(animate);
// A read-only snapshot makes browser verification and accessibility tooling inspectable.
window.petMarbles = {
  getSnapshot: () => ({
    level: state.level + 1,
    status: state.status,
    ammo: state.ammo,
    balls: state.balls.length,
    goals: { ...LEVELS[state.level].goals },
    collected: { ...state.collected },
    remaining: state.items.filter((e) => e.hp > 0).length,
    paused,
    unlocked: progress.unlocked + 1,
  }),
  getAim: () => ({ ...aim }),
  getBoard: () => state.items.map((e) => ({ ...e })),
};
