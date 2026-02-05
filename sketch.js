// Anna Wasson
// Lab 4: Pong (responsive version)
// + Score shake + punch + rainbow color on scoring

// ---------- Responsive helpers ----------
let baseW = 400;
let baseH = 400;

// scale factor based on smallest side (keep gameplay proportions)
function s(v) {
  return v * scaleFactor;
}
let scaleFactor = 1;

// ---------- Game state ----------
let xBall, yBall;
let xSpeed, ySpeed;
let score = 0;

let paddleX = 0;
let paddleSpeedBase = 10;

// ---- Score FX ----
let scoreShake = 0; // 0..1
let scoreShakeDecay = 0.88; // closer to 1 = longer
let scoreHue = 0; // rainbow base hue
let scoreHueSpeed = 18; // how fast rainbow cycles during shake

function triggerScoreFX() {
  scoreShake = 1;
  // randomize start hue so every score feels different
  scoreHue = random(0, 360);
}

// device motion
let accX = 0,
  accY = 0,
  accZ = 0;
let rrateX = 0,
  rrateY = 0,
  rrateZ = 0;

// device orientation
let rotateDegrees = 0;
let frontToBack = 0;
let leftToRight = 0;

let askButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  angleMode(DEGREES);

  // allow HSV/HSB rainbow coloring
  colorMode(HSB, 360, 100, 100, 1);

  resetScale();
  resetBall();
  paddleX = width / 2;

  // permission / listeners
  if (
    typeof DeviceMotionEvent?.requestPermission === "function" &&
    typeof DeviceOrientationEvent?.requestPermission === "function"
  ) {
    askButton = createButton("Permission");

    // Bigger button + styling
    askButton.size(s(180), s(60));
    askButton.style("font-size", s(20) + "px");
    askButton.style("border-radius", "12px");
    askButton.style("background", "#d9c3f7");
    askButton.style("border", "none");

    // top center
    askButton.position(width / 2 - s(90), s(20));

    askButton.mousePressed(handlePermissionButtonPressed);
  } else {
    window.addEventListener("devicemotion", deviceMotionHandler, true);
    window.addEventListener("deviceorientation", deviceTurnedHandler, true);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetScale();

  if (askButton) {
    askButton.size(s(180), s(60));
    askButton.style("font-size", s(20) + "px");
    askButton.position(width / 2 - s(90), s(20));
  }

  paddleX = constrain(paddleX, paddleHalfW(), width - paddleHalfW());
  xBall = constrain(xBall, ballR(), width - ballR());
  yBall = constrain(yBall, ballR(), height - ballR());
}

function resetScale() {
  scaleFactor = min(width / baseW, height / baseH);
}

function resetBall() {
  xBall = random(width * 0.25, width * 0.75);
  yBall = ballR() + s(30);

  xSpeed = random([-1, 1]) * random(s(2), s(7));
  ySpeed = random([-1, 1]) * random(s(2), s(7));
  if (ySpeed < 0) ySpeed *= -1;
}

function draw() {
  background(0);

  // decay + update rainbow while shaking
  if (scoreShake > 0) {
    scoreShake *= scoreShakeDecay;
    scoreHue = (scoreHue + scoreHueSpeed) % 360;
    if (scoreShake < 0.01) scoreShake = 0;
  }

  // ---------- Input -> paddle movement ----------
  let paddleSpeed = s(paddleSpeedBase);

  if (leftToRight > 20) paddleX += paddleSpeed;
  else if (leftToRight < -20) paddleX -= paddleSpeed;

  paddleX = constrain(paddleX, paddleHalfW(), width - paddleHalfW());

  // ---------- Ball ----------
  moveBall();
  bounceWalls();
  bouncePaddle();

  // ---------- Draw ----------
  drawTiltArrow();
  drawBall();
  drawPaddle();
  drawHUD();
}

function drawTiltArrow() {
  push();
  translate(width / 2, height / 2);

  noStroke();
  if (leftToRight > 20) {
    fill(0, 100, 100, 1); // red in HSB
    push();
    rotate(90);
    triangle(s(-30), s(-40), 0, s(-100), s(30), s(-40));
    pop();
  } else if (leftToRight < -20) {
    fill(220, 100, 100, 1); // blue-ish
    push();
    rotate(-90);
    triangle(s(-30), s(-40), 0, s(-100), s(30), s(-40));
    pop();
  } else if (frontToBack > 40) {
    fill(0, 0, 100, 1); // white in HSB
    push();
    rotate(-180);
    triangle(s(-30), s(-40), 0, s(-100), s(30), s(-40));
    pop();
  } else if (frontToBack < 0) {
    fill(0, 0, 100, 1);
    triangle(s(-30), s(-40), 0, s(-100), s(30), s(-40));
  }

  pop();
}

function drawBall() {
  // original lavender (approx) in HSB:
  // use a soft hue around 270 with low saturation
  fill(270, 22, 97, 1);
  noStroke();
  ellipse(xBall, yBall, ballR() * 2, ballR() * 2);
}

function drawPaddle() {
  fill(0, 0, 100, 1);
  noStroke();
  rect(paddleX, paddleY(), paddleW(), paddleH());
}

function drawHUD() {
  // ---- Score in center + shake + rainbow while shaking ----
  let baseX = width / 2;
  let baseY = height / 2;

  let shakePx = s(10) * scoreShake;
  let dx = random(-shakePx, shakePx);
  let dy = random(-shakePx, shakePx);

  let punch = 1 + 0.25 * scoreShake;

  // color: rainbow during shake, otherwise your original purple
  let col;
  if (scoreShake > 0) {
    // vivid rainbow
    col = color(scoreHue, 100, 100, 1);
  } else {
    // original-ish lavender
    col = color(270, 22, 97, 1);
  }

  push();
  translate(baseX + dx, baseY + dy);
  scale(punch);

  fill(col);
  noStroke();
  textSize(s(40));
  textAlign(CENTER, CENTER);
  text("Score: " + score, 0, 0);
  pop();

  // Debug text
  fill(0, 0, 100, 1);
  textSize(s(12));
  textAlign(LEFT, TOP);

  let y0 = s(10);
  text("acceleration:", s(10), y0);
  text(
    nf(accX, 1, 2) + ", " + nf(accY, 1, 2) + ", " + nf(accZ, 1, 2),
    s(10),
    y0 + s(16)
  );

  text("rotation rate:", s(10), y0 + s(40));
  text(
    nf(rrateX, 1, 2) + ", " + nf(rrateY, 1, 2) + ", " + nf(rrateZ, 1, 2),
    s(10),
    y0 + s(56)
  );

  text("device orientation:", s(10), y0 + s(80));
  text(
    nf(rotateDegrees, 1, 2) +
      ", " +
      nf(leftToRight, 1, 2) +
      ", " +
      nf(frontToBack, 1, 2),
    s(10),
    y0 + s(96)
  );
}

// ---------- Physics ----------
function moveBall() {
  xBall += xSpeed;
  yBall += ySpeed;
}

function bounceWalls() {
  if (xBall < ballR() || xBall > width - ballR()) {
    xSpeed *= -1;
    xBall = constrain(xBall, ballR(), width - ballR());
  }
  if (yBall < ballR()) {
    ySpeed *= -1;
    yBall = ballR();
  }
  if (yBall > height - ballR()) {
    resetBall();
  }
}

function bouncePaddle() {
  let px = paddleX;
  let py = paddleY();
  let halfW = paddleHalfW();
  let halfH = paddleH() / 2;

  let hitX = xBall > px - halfW && xBall < px + halfW;
  let hitY = yBall + ballR() >= py - halfH && yBall - ballR() <= py + halfH;

  if (hitX && hitY && ySpeed > 0) {
    ySpeed *= -1;

    let offset = (xBall - px) / halfW; // -1..1
    xSpeed += offset * s(1.5);

    score++;
    triggerScoreFX(); // <-- shake + rainbow trigger

    yBall = py - halfH - ballR();
  }
}

// ---------- Size getters ----------
function ballR() {
  return s(10);
}
function paddleW() {
  return s(90);
}
function paddleH() {
  return s(15);
}
function paddleHalfW() {
  return paddleW() / 2;
}
function paddleY() {
  return height - s(25);
}

// ---------- Permissions / Sensors ----------
function handlePermissionButtonPressed() {
  DeviceMotionEvent.requestPermission().then((response) => {
    if (response === "granted") {
      window.addEventListener("devicemotion", deviceMotionHandler, true);
    }
  });

  DeviceOrientationEvent.requestPermission()
    .then((response) => {
      if (response === "granted") {
        window.addEventListener("deviceorientation", deviceTurnedHandler, true);
      }
    })
    .catch(console.error);

  if (askButton) askButton.hide();
}

function deviceMotionHandler(event) {
  accX = event.acceleration?.x ?? 0;
  accY = event.acceleration?.y ?? 0;
  accZ = event.acceleration?.z ?? 0;

  rrateZ = event.rotationRate?.alpha ?? 0;
  rrateX = event.rotationRate?.beta ?? 0;
  rrateY = event.rotationRate?.gamma ?? 0;
}

function deviceTurnedHandler(event) {
  rotateDegrees = event.alpha ?? 0;
  frontToBack = event.beta ?? 0;
  leftToRight = event.gamma ?? 0;
}
