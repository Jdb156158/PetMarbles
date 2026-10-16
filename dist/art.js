const TAU = Math.PI * 2;
export function oval(c, x, y, rx, ry, fill) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fillStyle = fill;
  c.fill();
}
export function round(c, x, y, w, h, r, fill) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
}
function grad(c, x, y, r, a, b) {
  let g = c.createRadialGradient(
    x - r * 0.35,
    y - r * 0.5,
    r * 0.05,
    x,
    y,
    r * 1.3,
  );
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}
function shine(c, x, y, rx, ry) {
  c.save();
  c.rotate(-0.35);
  oval(c, x, y, rx, ry, "#ffffff65");
  c.restore();
}
function face(c, y = 3) {
  for (let x of [-8, 8]) {
    oval(c, x, y, 2.1, 3, "#34534e");
    oval(c, x - 0.6, y - 0.9, 0.65, 0.9, "#fff");
    oval(c, x * 1.5, y + 6, 3.5, 1.8, "#f59fa380");
  }
  c.strokeStyle = "#4c6b5c";
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-2, y + 6);
  c.quadraticCurveTo(0, y + 9, 2, y + 6);
  c.stroke();
}
export function pet(c, x, y, r = 22, kind = "pet", time = 0) {
  c.save();
  c.translate(x, y);
  c.scale(r / 22, r / 22);
  let bob = Math.sin(time * 2) * 0.7;
  c.translate(0, bob);
  oval(c, 0, 21, 22, 5, "#23352b18");
  if (kind === "pet") {
    c.save();
    c.rotate(-0.35);
    oval(c, -24, -9, 9, 5, "#98c8b9");
    oval(c, -23, -16, 9, 5, "#c2e9c4");
    oval(c, -22, -23, 9, 5, "#a7cbb7");
    c.restore();
    c.save();
    c.rotate(0.35);
    oval(c, 24, -9, 9, 5, "#98c8b9");
    oval(c, 23, -16, 9, 5, "#c2e9c4");
    oval(c, 22, -23, 9, 5, "#a7cbb7");
    c.restore();
    oval(c, -12, 18, 8, 6, "#8cbaac");
    oval(c, 12, 18, 8, 6, "#8cbaac");
    oval(c, 0, 0, 23, 24, grad(c, 0, -2, 24, "#dcf8df", "#91cfbd"));
    oval(c, 0, 12, 14, 10, "#e7f8ddaa");
    oval(c, -22, 7, 5, 8, "#a6d6ba");
    oval(c, 22, 7, 5, 8, "#a6d6ba");
    shine(c, -6, -16, 9, 4);
    face(c);
  } else if (kind === "plant") {
    c.save();
    c.rotate(-0.5);
    oval(c, -9, -21, 7, 14, "#93bc84");
    c.restore();
    c.save();
    c.rotate(0.5);
    oval(c, 9, -21, 7, 14, "#b3d89a");
    c.restore();
    oval(c, -11, 18, 7, 5, "#d693a7");
    oval(c, 11, 18, 7, 5, "#d693a7");
    oval(c, 0, 0, 22, 23, grad(c, 0, -3, 23, "#ffe4d9", "#e9adc0"));
    oval(c, 0, -18, 7, 7, "#e9c36e");
    oval(c, 0, -20, 5, 5, "#fff0aa");
    oval(c, 0, 12, 12, 9, "#ffeed9a0");
    shine(c, -6, -16, 8, 3);
    face(c);
  } else {
    for (let a of [-1, 1]) {
      c.save();
      c.rotate(a * 0.3);
      oval(c, a * 15, -22, 8, 15, "#b6abce");
      oval(c, a * 15, -23, 4, 8, "#e8d3dd");
      c.restore();
    }
    oval(c, -13, 18, 8, 5, "#a698c0");
    oval(c, 13, 18, 8, 5, "#a698c0");
    oval(c, 0, 1, 24, 23, grad(c, 0, -4, 24, "#e9def6", "#b1a2d1"));
    oval(c, 0, 14, 14, 9, "#f7e6ef90");
    face(c);
    c.fillStyle = "#fff3bd";
    c.beginPath();
    c.moveTo(0, -17);
    c.lineTo(2, -12);
    c.lineTo(7, -10);
    c.lineTo(2, -8);
    c.lineTo(0, -3);
    c.lineTo(-2, -8);
    c.lineTo(-7, -10);
    c.lineTo(-2, -12);
    c.closePath();
    c.fill();
  }
  c.restore();
}
export function drawItem(c, type, x, y, r = 18, time = 0) {
  if (type === "pet" || type === "plant" || type === "dream") {
    pet(c, x, y, r, type, time);
    return;
  }
  c.save();
  c.translate(x, y);
  c.scale(r / 18, r / 18);
  oval(c, 0, 19, 19, 4, "#1b15351e");
  if (type === "crate") {
    c.rotate(-0.12);
    round(c, -16, -15, 32, 30, 5, "#c98855");
    round(c, -16, -19, 32, 30, 5, "#e7ab6e");
    round(c, -13, -18, 26, 23, 3, grad(c, 0, -10, 26, "#ffe0a4", "#e7ae73"));
    round(c, -3, -18, 6, 25, 1, "#fff0bd");
    c.fillStyle = "#fff4c8";
    c.beginPath();
    c.moveTo(-16, -15);
    c.lineTo(-11, -19);
    c.lineTo(14, -19);
    c.lineTo(10, -15);
    c.fill();
    c.strokeStyle = "#b9824b50";
    c.lineWidth = 1;
    c.strokeRect(-11, -14, 22, 16);
  } else if (type === "star" || type === "leaf") {
    oval(c, 0, 0, 18, 18, "#f1ffff20");
    c.strokeStyle = "#d2eee7b0";
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(0, 0, 18, 0, TAU);
    c.stroke();
    c.beginPath();
    c.arc(0, 0, 15, 3.6, 4.6);
    c.strokeStyle = "#ffffffb0";
    c.stroke();
    if (type === "star") {
      c.fillStyle = "#ffe499";
      c.strokeStyle = "#e9ba5a";
      c.lineWidth = 1.5;
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        let a = (i * Math.PI) / 5 - Math.PI / 2,
          d = i % 2 ? 6 : 13;
        let xx = Math.cos(a) * d,
          yy = Math.sin(a) * d;
        i ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
      }
      c.closePath();
      c.fill();
      c.stroke();
    } else {
      c.save();
      c.rotate(-0.4);
      oval(c, -4, 1, 6, 10, "#a0cc88");
      c.rotate(0.8);
      oval(c, 4, -2, 6, 10, "#c1df91");
      c.restore();
      c.strokeStyle = "#7aab71";
      c.beginPath();
      c.moveTo(0, 12);
      c.lineTo(0, -1);
      c.stroke();
    }
  } else if (type === "cake") {
    round(c, -15, 4, 30, 15, 5, "#a57854");
    round(c, -15, 4, 30, 5, 2, "#e9bc89");
    oval(c, 0, 3, 16, 7, "#fff0cb");
    oval(c, -1, -3, 13, 8, "#fff6da");
    oval(c, 0, -10, 9, 7, "#fff8e3");
    oval(c, 2, -17, 5, 5, "#dc8990");
    oval(c, 0.5, -18.5, 1.5, 1, "#ffc6b1");
  } else if (type === "ice") {
    c.rotate(0.08);
    round(c, -16, -15, 32, 33, 5, "#68b6c8");
    round(c, -16, -20, 32, 33, 5, grad(c, 0, -5, 28, "#c5f1f3", "#75cbdc"));
    c.strokeStyle = "#eafffa";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-12, 5);
    c.lineTo(7, -14);
    c.moveTo(1, 7);
    c.lineTo(11, -3);
    c.stroke();
    round(c, -12, -16, 8, 3, 2, "#fff9");
  } else if (type === "wood") {
    c.rotate(-0.14);
    round(c, -23, -8, 46, 19, 3, "#a76e4b");
    round(c, -23, -12, 46, 18, 3, "#d7a87c");
    c.strokeStyle = "#aa79524f";
    c.lineWidth = 1.5;
    for (let y of [-7, -2, 2]) {
      c.beginPath();
      c.moveTo(-19, y);
      c.bezierCurveTo(-2, y - 3, 2, y + 4, 20, y);
      c.stroke();
    }
    oval(c, -16, -4, 1.3, 1.3, "#8a765d");
    oval(c, 16, -4, 1.3, 1.3, "#8a765d");
  } else if (type === "tree") {
    round(c, -4, 6, 8, 17, 3, "#a48559");
    for (let [xx, yy, rr, col] of [
      [-13, 0, 12, "#83b89b"],
      [12, 0, 12, "#91c3a0"],
      [-7, -12, 13, "#b6dbad"],
      [7, -11, 13, "#a1d0a2"],
      [0, 5, 14, "#9bc59b"],
    ])
      oval(c, xx, yy, rr, rr, col);
    for (let [xx, yy] of [
      [-13, 1],
      [7, -11],
      [13, 5],
      [-5, 9],
    ]) {
      oval(c, xx, yy, 4, 4, "#d98f92");
      oval(c, xx - 1, yy - 1, 1, 1, "#ffd4c1");
    }
  } else if (type === "cone") {
    oval(c, 0, 14, 18, 6, "#bb819d");
    c.beginPath();
    c.moveTo(-15, 12);
    c.quadraticCurveTo(-11, -3, -4, -17);
    c.quadraticCurveTo(0, -23, 4, -17);
    c.quadraticCurveTo(11, -3, 15, 12);
    c.closePath();
    c.fillStyle = grad(c, 0, -5, 23, "#ffe2db", "#d797b3");
    c.fill();
    c.strokeStyle = "#fff0db";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-9, -2);
    c.quadraticCurveTo(0, 4, 10, 0);
    c.moveTo(-13, 7);
    c.quadraticCurveTo(0, 14, 14, 8);
    c.stroke();
    oval(c, 0, -16, 4, 5, "#f8e5cc");
  }
  c.restore();
}
export function makeIcon(type, size = 48) {
  let el = document.createElement("canvas");
  el.width = el.height = size * 2;
  let c = el.getContext("2d");
  c.scale(2, 2);
  drawItem(c, type, size / 2, size / 2, size * 0.31);
  return el;
}
