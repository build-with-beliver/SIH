/**
 * BELIEVERS STUDIOS — REALISTIC CINEMATIC INTRO ORCHESTRATOR
 * ==========================================================
 * A seamless, movie-grade visual sequence:
 * 1. REAL SHUTTLE LIFTOFF: Actual launchpad, empty pad, real photo shuttle climbing
 *    with interactive smoke and booster flame.
 * 2. MAX-Q & STRATOSPHERIC ASCENT: Peak dynamic pressure educational telemetry.
 * 3. ORBITAL STAGING: Escape velocity (11.2 km/s), TMI injection to Mars.
 * 4. COCKPIT SYSTEMS CHECK: Real-life cockpit interior.
 * 5. ASTEROID EVASION & RETRO-BRAKING:
 *    - Constrained strictly INSIDE the distant circular observation window aperture!
 *    - Starfield & tumbling 3D asteroids slide left and right as the ship executes RCS rolls.
 *    - Physical retro-rocket braking deceleration.
 * 6. SYNCHRONIZED ROGUE ASTEROID IMPACT:
 *    - Rogue asteroid visibly hurtles through the starfield straight into the starboard window frame.
 *    - Exact millisecond frame impact: Spark explosion, spider-web glass fracture,
 *      turbulent camera shake, sirens, and sudden blackout.
 * 7. FIRST-PERSON AWAKENING POV: Eyelid blinking, stabilized vitals.
 * 8. AVENGERS-STYLE MARS LANDING RAMP OPENING:
 *    - Non-interactive video cutscene: Hydraulic unlatch, ramp lowers to soil,
 *      golden Martian sunlight and dust pour in, handing over seamlessly to the 3D game!
 */

'use strict';

/* ================================================================
   0. PRELOAD IMAGES & REAL PHOTO ASSETS
   ================================================================ */
const SCENE_IMAGES = {
  launchpad:      'scene-launchpad.jpg',
  launchpadEmpty: 'scene-launchpad-empty.jpg',
  shuttleCutout:  'shuttle-cutout-masked.png',
  launch:         'scene-launch.jpg',
  separation:     'scene-separation.jpg',
  cockpit:        'scene-cockpit.jpg',
  damage:         'scene-damage.jpg',
  wakeup:         'scene-wakeup.jpg',
  marsHatch:      'scene-mars-hatch.jpg',
  marsSurface:    'scene-mars-surface.jpg',
  asteroid1:      'asteroid-var-1.png',
  asteroid2:      'asteroid-var-2.png',
  asteroid3:      'asteroid-var-3.png',
  asteroid4:      'asteroid-var-4.png'
};

const _loadedImages = {};

function preloadImages() {
  return Promise.all(
    Object.entries(SCENE_IMAGES).map(([key, src]) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { _loadedImages[key] = img; resolve(img); };
      img.onerror = () => { resolve(null); };
      img.src = src;
    }))
  );
}

/* ================================================================
   1. SYNTHESIZED WEB AUDIO ENGINE
   ================================================================ */
let _actx = null;
function actx() {
  if (!_actx) {
    const C = window.AudioContext || window.webkitAudioContext;
    _actx = new C();
  }
  if (_actx.state === 'suspended') _actx.resume();
  return _actx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, delay = 0) {
  try {
    const ctx = actx(), t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.01);
  } catch(e) {}
}

let _rumbleNode = null, _rumbleGain = null;
function startEngineRumble(vol = 0.3) {
  try {
    const ctx = actx();
    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(95, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.2);
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
    _rumbleNode = src; _rumbleGain = gain;
  } catch(e) {}
}

function stopEngineRumble(fade = 0.8) {
  try {
    if (_rumbleGain) {
      _rumbleGain.gain.linearRampToValueAtTime(0.001, actx().currentTime + fade);
      setTimeout(() => { if (_rumbleNode) _rumbleNode.stop(); _rumbleNode = null; }, fade * 1000 + 50);
    }
  } catch(e) {}
}

let _sirenNode = null, _sirenInterval = null;
function startSiren() {
  try {
    let hi = false;
    _sirenInterval = setInterval(() => {
      hi = !hi;
      tone(hi ? 980 : 650, 0.22, 'sawtooth', 0.16);
    }, 240);
  } catch(e) {}
}

function stopSiren(fade = 0.5) {
  clearInterval(_sirenInterval);
  _sirenInterval = null;
}

let _alarmOsc = null, _alarmGain = null, _alarmTimer = null;
function startWarningAlarm() {
  try {
    let on = false;
    _alarmTimer = setInterval(() => {
      on = !on;
      if (on) tone(880, 0.12, 'square', 0.14);
    }, 280);
  } catch(e) {}
}

function stopWarningAlarm() {
  clearInterval(_alarmTimer);
  _alarmTimer = null;
}

function playCrash() {
  try {
    tone(45, 1.8, 'sawtooth', 0.45);
    tone(75, 1.2, 'square', 0.35);
    const ctx = actx(), buf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < buf.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.setValueAtTime(420, ctx.currentTime);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.5, ctx.currentTime);
    src.connect(filt); filt.connect(g); g.connect(ctx.destination);
    src.start();
  } catch(e) {}
}

function cinematicBoom() {
  tone(38, 2.8, 'sine', 0.45);
  tone(60, 1.6, 'triangle', 0.25);
}

function beepCountdown(n) {
  tone(n === 0 ? 1200 : 750, n === 0 ? 0.6 : 0.15, 'sine', n === 0 ? 0.3 : 0.18);
}

let _heartbeatTimer = null;
function startHeartbeat() {
  const beat = () => {
    tone(55, 0.1, 'sine', 0.25);
    setTimeout(() => tone(45, 0.1, 'sine', 0.18), 180);
  };
  beat();
  _heartbeatTimer = setInterval(beat, 1100);
}

function stopHeartbeat() {
  clearInterval(_heartbeatTimer);
  _heartbeatTimer = null;
}

let _tinnitusOsc = null, _tinnitusGain = null;
function startTinnitus(vol = 0.08) {
  try {
    const ctx = actx();
    _tinnitusOsc = ctx.createOscillator();
    _tinnitusGain = ctx.createGain();
    _tinnitusOsc.type = 'sine';
    _tinnitusOsc.frequency.setValueAtTime(3800, ctx.currentTime);
    _tinnitusGain.gain.setValueAtTime(0.001, ctx.currentTime);
    _tinnitusGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.2);
    _tinnitusOsc.connect(_tinnitusGain);
    _tinnitusGain.connect(ctx.destination);
    _tinnitusOsc.start();
  } catch(e) {}
}

function stopTinnitus(fade = 2.0) {
  try {
    if (_tinnitusGain) {
      _tinnitusGain.gain.linearRampToValueAtTime(0.0001, actx().currentTime + fade);
      setTimeout(() => { if (_tinnitusOsc) _tinnitusOsc.stop(); _tinnitusOsc = null; }, fade * 1000 + 50);
    }
  } catch(e) {}
}

let _ambientHum = null, _ambientGain = null;
function startAmbientHum(vol = 0.05) {
  try {
    const ctx = actx();
    _ambientHum = ctx.createOscillator();
    _ambientGain = ctx.createGain();
    _ambientHum.type = 'sine';
    _ambientHum.frequency.setValueAtTime(72, ctx.currentTime);
    _ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
    _ambientGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5);
    _ambientHum.connect(_ambientGain);
    _ambientGain.connect(ctx.destination);
    _ambientHum.start();
  } catch(e) {}
}

function stopAmbientHum(fade = 0.5) {
  try {
    if (_ambientGain) {
      _ambientGain.gain.linearRampToValueAtTime(0.001, actx().currentTime + fade);
      setTimeout(() => { if (_ambientHum) _ambientHum.stop(); _ambientHum = null; }, fade * 1000 + 50);
    }
  } catch(e) {}
}

function radioChatter() {
  for (let i = 0; i < 4; i++) {
    setTimeout(() => tone(600 + Math.random() * 600, 0.04, 'triangle', 0.05), i * 70);
  }
}

function rcsThrusterSound() {
  try {
    tone(240, 0.35, 'triangle', 0.15);
    tone(120, 0.45, 'sawtooth', 0.12);
  } catch(e) {}
}

function retroBrakingSound() {
  try {
    tone(85, 1.4, 'sawtooth', 0.3);
    tone(55, 1.8, 'sine', 0.35);
  } catch(e) {}
}

function hydraulicHatchOpenSound() {
  try {
    tone(95, 2.2, 'sawtooth', 0.3);
    tone(48, 2.5, 'sine', 0.35);
    setTimeout(() => tone(440, 0.2, 'triangle', 0.12), 1200);
  } catch(e) {}
}

/* ================================================================
   2. FX PARTICLE SYSTEM (Smoke, Sparks, Debris)
   ================================================================ */
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
  }

  emit(count, cfg) {
    for (let i = 0; i < count; i++) {
      const angle = (cfg.angleMin + Math.random() * (cfg.angleMax - cfg.angleMin)) * Math.PI / 180;
      const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
      this.particles.push({
        x: cfg.x + (Math.random() - 0.5) * (cfg.spread || 0),
        y: cfg.y + (Math.random() - 0.5) * (cfg.spreadY || 0),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: cfg.lifeMin + Math.random() * (cfg.lifeMax - cfg.lifeMin),
        maxLife: cfg.lifeMax,
        size: cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin),
        color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        sizeGrowth: cfg.sizeGrowth || 0
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += (p.sizeGrowth || 0) * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear() { this.particles = []; }
}

/* ================================================================
   3. DISTANT COCKPIT CIRCULAR WINDOW ASTEROID VIEWPORT
   ================================================================ */
class CockpitWindowAsteroids3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.asteroids = [];
    this.stars = [];
    this.variantKeys = ['asteroid1', 'asteroid2', 'asteroid3', 'asteroid4'];
    this.shipRollOffset = 0;
    this.shipPitchOffset = 0;
    this.onHitImpact = null;
    this.hitTriggered = false;

    // Generate deep space starfield visible through the distant window
    for (let s = 0; s < 120; s++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (parent && parent.clientWidth > 0) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    } else {
      this.canvas.width = window.innerWidth * 0.28;
      this.canvas.height = window.innerHeight * 0.50;
    }
  }

  spawnEvasiveSwarm() {
    for (let i = 0; i < 7; i++) {
      const vk = this.variantKeys[i % this.variantKeys.length];
      const img = _loadedImages[vk];
      const side = (i % 2 === 0) ? 1 : -1;

      this.asteroids.push({
        img: img,
        x: side * (80 + Math.random() * 160),
        y: (Math.random() - 0.5) * 160,
        z: 900 + i * 220,
        vx: side * (70 + Math.random() * 90),
        vy: (Math.random() - 0.5) * 50,
        vz: -320 - Math.random() * 140,
        baseSize: 180 + Math.random() * 160,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.8,
        isHitAsteroid: false
      });
    }
  }

  spawnRogueAsteroid(onHit) {
    this.onHitImpact = onHit;
    this.hitTriggered = false;

    const vk = this.variantKeys[0];
    const img = _loadedImages[vk];

    // Starts in deep space and hurtles specifically into the starboard window frame
    this.asteroids.push({
      img: img,
      x: 130,
      y: -30,
      z: 780,
      vx: -40,
      vy: 18,
      vz: -420, // Reaches z = 25 in ~1.8 seconds!
      baseSize: 520, // Massive rock
      rotation: 0.2,
      rotSpeed: 0.9,
      isHitAsteroid: true
    });
  }

  update(dt) {
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i];
      a.z += a.vz * dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rotation += a.rotSpeed * dt;

      // Exact synchronized collision check!
      if (a.isHitAsteroid && a.z <= 32 && !this.hitTriggered) {
        this.hitTriggered = true;
        if (this.onHitImpact) this.onHitImpact();
        this.asteroids.splice(i, 1);
        continue;
      }

      if (!a.isHitAsteroid && a.z <= 20) {
        this.asteroids.splice(i, 1);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Deep space backdrop
    ctx.fillStyle = '#02040b';
    ctx.fillRect(0, 0, W, H);

    // Stars shifting with roll/pitch
    ctx.fillStyle = '#ffffff';
    for (const star of this.stars) {
      const sx = (W * 0.5 + star.x + this.shipRollOffset * 0.5 + W) % W;
      const sy = (H * 0.5 + star.y + this.shipPitchOffset * 0.5 + H) % H;
      ctx.globalAlpha = star.alpha;
      ctx.fillRect(sx, sy, star.size, star.size);
    }
    ctx.globalAlpha = 1.0;

    const cx = W * 0.5 + this.shipRollOffset;
    const cy = H * 0.5 + this.shipPitchOffset;
    const fov = 340;

    const sorted = [...this.asteroids].sort((a, b) => b.z - a.z);

    for (const a of sorted) {
      if (a.z <= 15) continue;
      const scale = fov / a.z;
      const sx = cx + a.x * scale;
      const sy = cy + a.y * scale;
      const w = a.baseSize * scale;
      const h = a.baseSize * scale;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(a.rotation);

      if (a.img && a.img.complete) {
        ctx.drawImage(a.img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = '#4a443c';
        ctx.beginPath();
        ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2c2722';
        ctx.beginPath();
        ctx.arc(-w * 0.2, -h * 0.1, w * 0.15, 0, Math.PI * 2);
        ctx.arc(w * 0.15, h * 0.2, w * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  clear() {
    this.asteroids = [];
  }
}

/* ================================================================
   4. CINEMATIC INTRO ORCHESTRATOR
   ================================================================ */
class CinematicIntro {
  constructor() {
    this.overlay = null;
    this.cameraRig = null;
    this.bgCurrent = null;
    this.bgNext = null;
    this.realShuttle = null;
    this.shuttlePlume = null;
    this.fxCanvas = null;
    this.particles = null;

    this.windowFrameContainer = null;
    this.asteroidCanvas = null;
    this.windowAsteroids = null;

    this.hudEl = null;
    this.textEl = null;
    this.countdownEl = null;
    this.vignetteEl = null;
    this.flashEl = null;
    this.cracksEl = null;
    this.eyelidsTop = null;
    this.eyelidsBottom = null;

    this.running = false;
    this.rafId = null;
    this.lastTime = 0;
    this.onComplete = null;
  }

  createDOM() {
    const old = document.getElementById('cinematic-overlay');
    if (old) old.remove();

    const ov = document.createElement('div');
    ov.id = 'cinematic-overlay';
    ov.style.cssText = `
      position:fixed; top:0; left:0; width:100vw; height:100vh;
      z-index:500; background:#000; overflow:hidden;
      perspective: 1200px;
    `;

    const rig = document.createElement('div');
    rig.id = 'cine-camera-rig';
    rig.style.cssText = `
      position:absolute; inset:-5%; width:110%; height:110%;
      transform-origin: 50% 50%;
      transition: transform 0.08s linear, filter 0.3s ease;
      will-change: transform, filter;
    `;
    ov.appendChild(rig);
    this.cameraRig = rig;

    const bg1 = document.createElement('div');
    bg1.style.cssText = `
      position:absolute; inset:0; background-size:cover; background-position:center;
      transition: opacity 1.0s cubic-bezier(0.2,0.8,0.2,1), transform 1.2s cubic-bezier(0.2,0.8,0.2,1);
    `;
    rig.appendChild(bg1);
    this.bgCurrent = bg1;

    const bg2 = document.createElement('div');
    bg2.style.cssText = `
      position:absolute; inset:0; background-size:cover; background-position:center;
      opacity:0; transition: opacity 1.0s cubic-bezier(0.2,0.8,0.2,1), transform 1.2s cubic-bezier(0.2,0.8,0.2,1);
    `;
    rig.appendChild(bg2);
    this.bgNext = bg2;

    const shuttle = document.createElement('div');
    shuttle.id = 'cine-real-shuttle';
    shuttle.style.cssText = `
      position:absolute;
      left: 53.7%; top: 12.1%;
      width: 18.5%; height: 65.1%;
      background: url('shuttle-cutout-masked.png') no-repeat center center;
      background-size: contain;
      display: none; pointer-events: none; z-index: 4;
      will-change: transform;
      filter: drop-shadow(0 15px 35px rgba(0,0,0,0.7));
    `;

    const plume = document.createElement('div');
    plume.id = 'shuttle-booster-plume';
    plume.style.cssText = `
      position: absolute;
      bottom: -65%; left: 8%; width: 84%; height: 75%;
      pointer-events: none; display: none;
      background: radial-gradient(ellipse at 50% 0%, #ffffff 0%, #fff088 20%, #ff8800 50%, #ff2200 75%, transparent 100%);
      filter: blur(4px) drop-shadow(0 0 35px #ff6600);
      mix-blend-mode: screen;
      transform-origin: 50% 0%;
      animation: plumeFlicker 0.08s infinite alternate;
    `;
    shuttle.appendChild(plume);
    this.shuttlePlume = plume;
    rig.appendChild(shuttle);
    this.realShuttle = shuttle;

    // DISTANT CIRCULAR COCKPIT VIEWPORT FOR ASTEROIDS
    // Positioned precisely over the distant circular window in scene-cockpit.jpg!
    const winContainer = document.createElement('div');
    winContainer.id = 'cine-cockpit-window-aperture';
    winContainer.style.cssText = `
      position: absolute;
      top: 46.8%; left: 53.4%; width: 27.5%; height: 49.5%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      clip-path: circle(46% at 50% 50%);
      pointer-events: none; z-index: 3;
      display: none; overflow: hidden;
      background: radial-gradient(circle at 50% 50%, #030814 0%, #010206 100%);
    `;
    const astCv = document.createElement('canvas');
    astCv.style.cssText = 'position:absolute; inset:0; width:100%; height:100%;';
    winContainer.appendChild(astCv);
    rig.appendChild(winContainer);
    this.windowFrameContainer = winContainer;
    this.asteroidCanvas = astCv;
    this.windowAsteroids = new CockpitWindowAsteroids3D(astCv);

    // Full-Screen FX Canvas
    const cv = document.createElement('canvas');
    cv.id = 'cine-particles';
    cv.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;';
    ov.appendChild(cv);
    this.fxCanvas = cv;
    this.particles = new ParticleSystem(cv);

    // Red vignette
    const vig = document.createElement('div');
    vig.id = 'cine-vignette';
    vig.style.cssText = `
      position:absolute; inset:0; pointer-events:none; z-index:6;
      opacity:0; transition: opacity 0.12s ease;
      box-shadow: inset 0 0 160px 80px rgba(255,0,0,0.9);
    `;
    ov.appendChild(vig);
    this.vignetteEl = vig;

    // Spider-web glass cracks centered on the starboard frame!
    const cracks = document.createElement('div');
    cracks.id = 'cine-cracks';
    cracks.style.cssText = `
      position: absolute;
      top: 46.8%; left: 53.4%; width: 27.5%; height: 49.5%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      clip-path: circle(46% at 50% 50%);
      pointer-events: none; z-index: 7;
      opacity: 0; transition: opacity 0.12s ease;
      background:
        radial-gradient(circle at 74% 42%, transparent 0%, rgba(255,255,255,0.12) 8%, transparent 14%),
        repeating-radial-gradient(circle at 74% 42%, rgba(255,255,255,0.9) 0px, transparent 2px, transparent 22px),
        repeating-conic-gradient(from 0deg at 74% 42%, rgba(255,255,255,0.85) 0deg, transparent 4deg, transparent 24deg);
      filter: drop-shadow(0 0 14px rgba(255,255,255,1));
    `;
    rig.appendChild(cracks);
    this.cracksEl = cracks;

    // White flash
    const flash = document.createElement('div');
    flash.id = 'cine-flash';
    flash.style.cssText = `
      position:absolute; inset:0; pointer-events:none; z-index:8;
      background:#fff; opacity:0; transition: opacity 0.08s ease-out;
    `;
    ov.appendChild(flash);
    this.flashEl = flash;

    // Eyelids
    const eyeTop = document.createElement('div');
    eyeTop.style.cssText = `
      position:absolute; top:0; left:0; width:100%; height:55%;
      background:#000; z-index:9; transform: translateY(-100%);
      transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    `;
    ov.appendChild(eyeTop);
    this.eyelidsTop = eyeTop;

    const eyeBot = document.createElement('div');
    eyeBot.style.cssText = `
      position:absolute; bottom:0; left:0; width:100%; height:55%;
      background:#000; z-index:9; transform: translateY(100%);
      transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    `;
    ov.appendChild(eyeBot);
    this.eyelidsBottom = eyeBot;

    // HUD Header & Educational Mission Telemetry Bar
    const hud = document.createElement('div');
    hud.id = 'cine-hud';
    hud.style.cssText = `
      position:absolute; top:30px; left:40px; right:40px;
      display:flex; justify-content:space-between; align-items:flex-start;
      color:#00ff88; font-family:-apple-system, BlinkMacSystemFont, monospace;
      font-size:0.85rem; font-weight:800; letter-spacing:0.18em;
      text-transform:uppercase; z-index:10; pointer-events:none;
      text-shadow:0 0 10px rgba(0,255,136,0.6);
      opacity:0; transition: opacity 0.6s ease;
    `;
    hud.innerHTML = `
      <div>
        <div style="font-size:1.05rem; letter-spacing:0.25em; color:#00e5ff;">BELIEVERS-1 &bull; STARSHIP HUD</div>
        <div style="font-size:0.75rem; color:#88bbdd; margin-top:4px;">
          MISSION ELAPSED: <span id="hud-met">T-00:00:00</span> &bull; ALTITUDE: <span id="hud-alt">0.0 KM</span>
        </div>
        <div id="hud-edu-bar" style="font-size:0.72rem; color:#ffd080; margin-top:6px; background:rgba(6,18,32,0.85); border:1px solid rgba(255,180,40,0.5); padding:6px 14px; border-radius:4px; max-width:650px; line-height:1.4;">
          CHECKPOINT 1: PRE-LAUNCH SYSTEMS VERIFICATION
        </div>
      </div>
      <div style="text-align:right;">
        <div>STATUS: <span id="hud-status" style="color:#00ff88;">NOMINAL</span></div>
        <div style="font-size:0.75rem; color:#88bbdd; margin-top:4px;">
          VELOCITY: <span id="hud-vel">0.00 KM/S</span>
        </div>
      </div>
    `;
    ov.appendChild(hud);
    this.hudEl = hud;

    // Center Dialog Text
    const txt = document.createElement('div');
    txt.id = 'cine-text';
    txt.style.cssText = `
      position:absolute; bottom:12%; left:50%; transform:translateX(-50%);
      color:#fff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size:1.35rem; font-weight:800; letter-spacing:0.14em;
      text-align:center; z-index:11; pointer-events:none;
      text-shadow:0 2px 25px rgba(0,0,0,0.95), 0 0 30px rgba(0,210,255,0.7);
      opacity:0; transition: opacity 0.35s ease, transform 0.35s ease;
      max-width:85vw;
    `;
    ov.appendChild(txt);
    this.textEl = txt;

    // Big Countdown Numbers
    const cd = document.createElement('div');
    cd.id = 'cine-countdown';
    cd.style.cssText = `
      position:absolute; top:42%; left:50%; transform:translate(-50%, -50%);
      font-family:-apple-system, BlinkMacSystemFont, sans-serif;
      font-size:14vw; font-weight:900; color:#fff;
      text-shadow:0 0 50px rgba(255,255,255,0.9), 0 0 90px rgba(255,120,0,0.8);
      z-index:12; pointer-events:none; opacity:0;
      transition: opacity 0.15s ease, transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
    `;
    ov.appendChild(cd);
    this.countdownEl = cd;

    // Skip Button
    const skip = document.createElement('button');
    skip.id = 'cine-skip';
    skip.textContent = 'SKIP INTRO [ESC] >>';
    skip.style.cssText = `
      position:absolute; bottom:25px; right:35px;
      background:rgba(6,18,30,0.75); border:1px solid rgba(0,210,255,0.6);
      color:#00e5ff; font-family:monospace; font-size:0.75rem; font-weight:800;
      letter-spacing:0.15em; padding:8px 16px; border-radius:4px;
      cursor:pointer; z-index:20; backdrop-filter:blur(6px);
      transition: all 0.2s ease;
    `;
    skip.onmouseenter = () => { skip.style.borderColor = '#00ff88'; skip.style.color = '#00ff88'; };
    skip.onmouseleave = () => { skip.style.borderColor = 'rgba(0,210,255,0.6)'; skip.style.color = '#00e5ff'; };
    skip.onclick = () => this.skipIntro();
    ov.appendChild(skip);

    const escHandler = (e) => {
      if (e.code === 'Escape' && this.running) {
        window.removeEventListener('keydown', escHandler);
        this.skipIntro();
      }
    };
    window.addEventListener('keydown', escHandler);

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    document.body.appendChild(ov);
    this.overlay = ov;
  }

  resizeCanvas() {
    if (!this.fxCanvas) return;
    this.fxCanvas.width = window.innerWidth;
    this.fxCanvas.height = window.innerHeight;
    if (this.windowAsteroids) this.windowAsteroids.resize();
  }

  setCamera(x, y, scale = 1, rot = 0) {
    if (!this.cameraRig) return;
    this.cameraRig.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rot}deg)`;
  }

  cameraShake(intensity = 10, durationMs = 800) {
    const start = performance.now();
    const orig = this.cameraRig.style.transform;
    const shakeLoop = () => {
      if (!this.running) return;
      const elapsed = performance.now() - start;
      if (elapsed >= durationMs) return;
      const decay = 1 - (elapsed / durationMs);
      const rx = (Math.random() - 0.5) * intensity * decay;
      const ry = (Math.random() - 0.5) * intensity * decay;
      const rRot = (Math.random() - 0.5) * (intensity * 0.12) * decay;
      this.cameraRig.style.transform = `${orig} translate(${rx}px, ${ry}px) rotate(${rRot}deg)`;
      requestAnimationFrame(shakeLoop);
    };
    shakeLoop();
  }

  flash(durationMs = 120) {
    if (!this.flashEl) return;
    this.flashEl.style.opacity = '1';
    setTimeout(() => { if (this.flashEl) this.flashEl.style.opacity = '0'; }, durationMs);
  }

  showText(html, delay = 0) {
    setTimeout(() => {
      if (!this.textEl) return;
      this.textEl.innerHTML = html;
      this.textEl.style.opacity = '1';
      this.textEl.style.transform = 'translateX(-50%) translateY(0)';
    }, delay);
  }

  hideText() {
    if (!this.textEl) return;
    this.textEl.style.opacity = '0';
    this.textEl.style.transform = 'translateX(-50%) translateY(10px)';
  }

  showCountdown(val) {
    if (!this.countdownEl) return;
    this.countdownEl.textContent = val;
    this.countdownEl.style.transform = 'translate(-50%, -50%) scale(1.35)';
    this.countdownEl.style.opacity = '1';
    setTimeout(() => {
      if (this.countdownEl) {
        this.countdownEl.style.transform = 'translate(-50%, -50%) scale(1.0)';
      }
    }, 120);
    setTimeout(() => {
      if (this.countdownEl) this.countdownEl.style.opacity = '0';
    }, 780);
  }

  showEducationalBanner(title, text) {
    const bar = document.getElementById('hud-edu-bar');
    if (!bar) return;
    bar.innerHTML = `<strong>${title}:</strong> ${text}`;
    bar.style.borderColor = '#00ff88';
    setTimeout(() => { if (bar) bar.style.borderColor = 'rgba(255,180,40,0.5)'; }, 2800);
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  startLoop() {
    this.running = true;
    this.lastTime = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.particles.update(dt);
      this.windowAsteroids.update(dt);
      this.particles.draw();
      this.windowAsteroids.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  destroy() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    stopSiren(0.2);
    stopEngineRumble(0.4);
    stopHeartbeat();
    stopTinnitus(0.5);
    stopAmbientHum(0.3);
    stopWarningAlarm();
    if (this.overlay) this.overlay.remove();
  }

  skipIntro() {
    this.destroy();
    if (this.onComplete) this.onComplete();
  }

  /* ================================================================
     5. SEAMLESS CINEMATIC SEQUENCE
     ================================================================ */
  async play(onComplete) {
    this.onComplete = onComplete;
    this.createDOM();
    this.startLoop();

    try {
      await this.sceneCountdownAndRealLiftoff();
      if (!this.running) return;

      await this.sceneAtmosphericTrackingShot();
      if (!this.running) return;

      await this.sceneOrbitalStageSeparation();
      if (!this.running) return;

      await this.sceneCockpitFlyInAndSystemsCheck();
      if (!this.running) return;

      await this.sceneCockpitEvasiveManeuversAndBraking();
      if (!this.running) return;

      await this.sceneSingleAsteroidImpactAndTurbulence();
      if (!this.running) return;

      await this.sceneSuddenBlackout();
      if (!this.running) return;

      await this.sceneAwakeningPOV();
      if (!this.running) return;

      await this.sceneAvengersMarsLandingHatchOpening();
    } catch(e) {
      console.error('[CinematicIntro]', e);
    }

    this.destroy();
    if (onComplete) onComplete();
  }

  /* -------------------------------------------------------------
     SCENE 1: COUNTDOWN & REAL PHOTO SHUTTLE LIFTOFF
     ------------------------------------------------------------- */
  async sceneCountdownAndRealLiftoff() {
    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.launchpad}')`;
    this.bgCurrent.style.opacity = '1';
    this.hudEl.style.opacity = '1';

    this.setCamera(-40, 15, 1.05);

    this.showText('MISSION CONTROL: "Believers-1, terminal countdown sequence started."', 200);
    this.showEducationalBanner('SPACE MISSION 1: LIFTOFF & TERMINAL COUNTDOWN', 'Primary flight computers verify cryogenic LH2/LOX propellant pressure and telemetry links.');
    radioChatter();
    await this.sleep(1800);
    this.hideText();

    const W = this.fxCanvas.width, H = this.fxCanvas.height;
    const padRocketX = W * 0.63;
    const padRocketY = H * 0.72;

    for (let i = 5; i >= 1; i--) {
      if (!this.running) return;
      this.showCountdown(i);
      beepCountdown(i);

      if (i <= 3) {
        this.particles.emit(25, {
          x: padRocketX, y: padRocketY, spread: 45, spreadY: 10,
          angleMin: 40, angleMax: 140, speedMin: 80, speedMax: 220,
          lifeMin: 0.2, lifeMax: 0.5, sizeMin: 2, sizeMax: 5,
          colors: ['#ffffff', '#ffea88', '#ff9900']
        });
        this.cameraShake(3 + (4 - i) * 3, 700);
      }

      await this.sleep(1000);
    }

    beepCountdown(0);
    this.showCountdown('IGNITION');
    this.countdownEl.style.fontSize = '8vw';
    this.countdownEl.style.color = '#ff6600';
    this.flash(200);
    this.cameraShake(18, 3000);
    startEngineRumble(0.35);

    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.launchpadEmpty}')`;
    this.realShuttle.style.display = 'block';
    this.realShuttle.style.transform = 'translateY(0px)';
    this.shuttlePlume.style.display = 'block';

    const smokeInterval = setInterval(() => {
      if (!this.running) { clearInterval(smokeInterval); return; }
      this.particles.emit(18, {
        x: padRocketX - 50, y: padRocketY + 30, spread: 80, spreadY: 20,
        angleMin: 140, angleMax: 220, speedMin: 140, speedMax: 340,
        lifeMin: 1.2, lifeMax: 2.8, sizeMin: 15, sizeMax: 40,
        colors: ['rgba(235,235,235,0.7)', 'rgba(210,210,210,0.6)', 'rgba(255,180,100,0.7)'],
        sizeGrowth: 18
      });
      this.particles.emit(18, {
        x: padRocketX + 50, y: padRocketY + 30, spread: 80, spreadY: 20,
        angleMin: -40, angleMax: 40, speedMin: 140, speedMax: 340,
        lifeMin: 1.2, lifeMax: 2.8, sizeMin: 15, sizeMax: 40,
        colors: ['rgba(235,235,235,0.7)', 'rgba(210,210,210,0.6)', 'rgba(255,180,100,0.7)'],
        sizeGrowth: 18
      });
    }, 40);

    this.showText('LIFTOFF! WE HAVE A LIFTOFF OF BELIEVERS-1!', 300);
    this.showEducationalBanner('SPACE MISSION 2: ATMOSPHERIC PENETRATION', 'Reaching Max-Q at 14.2 km. Overcoming aerodynamic mechanical drag at Mach 5.1 (1,650 m/s).');

    const startTime = performance.now();
    const liftoffDuration = 4200;

    await new Promise((resolve) => {
      const climbAnim = (now) => {
        if (!this.running) { resolve(); return; }
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / liftoffDuration);
        const easeQuad = p * p;
        const climbPx = -easeQuad * (window.innerHeight * 1.35);

        this.realShuttle.style.transform = `translateY(${climbPx}px) scale(${1.0 - p * 0.35})`;

        const hudAlt = document.getElementById('hud-alt');
        const hudVel = document.getElementById('hud-vel');
        if (hudAlt) hudAlt.textContent = `${(p * 14.2).toFixed(1)} KM`;
        if (hudVel) hudVel.textContent = `${(p * 1.65).toFixed(2)} KM/S`;

        if (p < 1) {
          requestAnimationFrame(climbAnim);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(climbAnim);
    });

    clearInterval(smokeInterval);
    this.hideText();
  }

  /* -------------------------------------------------------------
     SCENE 2: STRATOSPHERIC ASCENT
     ------------------------------------------------------------- */
  async sceneAtmosphericTrackingShot() {
    this.realShuttle.style.display = 'none';
    this.shuttlePlume.style.display = 'none';

    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.launch}')`;
    this.setCamera(0, 0, 1.0);

    this.showText('MISSION CONTROL: "Believers-1, altitude 45 kilometers. Max-Q cleared nominal."', 300);
    this.showEducationalBanner('SPACE MISSION 3: STRATOPAUSE BOUNDARY', 'Atmospheric density drops to 0.1%. Transitioning from aerodynamic lift to pure rocket vacuum thrust.');
    radioChatter();

    const hudAlt = document.getElementById('hud-alt');
    const hudVel = document.getElementById('hud-vel');
    if (hudAlt) hudAlt.textContent = '45.0 KM';
    if (hudVel) hudVel.textContent = '3.80 KM/S';

    const W = this.fxCanvas.width, H = this.fxCanvas.height;
    for (let b = 0; b < 6; b++) {
      this.particles.emit(16, {
        x: W * 0.52, y: H * 0.42, spread: 30,
        angleMin: 80, angleMax: 100, speedMin: 180, speedMax: 420,
        lifeMin: 0.3, lifeMax: 0.8, sizeMin: 2, sizeMax: 6,
        colors: ['#ffffff', '#ffeedd', '#ff9900', '#ff5500']
      });
      await this.sleep(400);
    }

    this.hideText();
  }

  /* -------------------------------------------------------------
     SCENE 3: ORBITAL STAGE SEPARATION & ESCAPE VELOCITY
     ------------------------------------------------------------- */
  async sceneOrbitalStageSeparation() {
    this.bgNext.style.backgroundImage = `url('${SCENE_IMAGES.separation}')`;
    this.bgNext.style.opacity = '1';
    await this.sleep(400);
    this.bgCurrent.style.opacity = '0';
    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.separation}')`;
    this.bgCurrent.style.opacity = '1';
    this.bgNext.style.opacity = '0';

    this.showText('MISSION CONTROL: "Solid Rocket Boosters separation confirmed. Upper stage ignition."', 300);
    this.showEducationalBanner('SPACE MISSION 4: EARTH ESCAPE VELOCITY & TMI', 'Accelerating past 11.2 km/s (40,320 km/h) into Trans-Mars Injection along the Hohmann Transfer Orbit.');
    radioChatter();

    const hudAlt = document.getElementById('hud-alt');
    const hudVel = document.getElementById('hud-vel');
    if (hudAlt) hudAlt.textContent = '185.0 KM';
    if (hudVel) hudVel.textContent = '11.20 KM/S (ESCAPE)';

    const W = this.fxCanvas.width, H = this.fxCanvas.height;
    this.particles.emit(65, {
      x: W * 0.5, y: H * 0.5, spread: 80,
      angleMin: 0, angleMax: 360, speedMin: 60, speedMax: 240,
      lifeMin: 0.6, lifeMax: 1.8, sizeMin: 1.5, sizeMax: 4,
      colors: ['#ffffff', '#aaddff', '#ffdd88']
    });

    this.cameraShake(6, 1200);
    await this.sleep(3500);
    this.hideText();
    stopEngineRumble(1.2);
  }

  /* -------------------------------------------------------------
     SCENE 4: COCKPIT PUSH-IN & SYSTEMS CHECK
     ------------------------------------------------------------- */
  async sceneCockpitFlyInAndSystemsCheck() {
    this.setCamera(0, 0, 1.4);
    await this.sleep(600);

    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.cockpit}')`;
    this.setCamera(0, 0, 1.0);
    this.particles.clear();
    startAmbientHum(0.04);

    const hudStatus = document.getElementById('hud-status');
    if (hudStatus) { hudStatus.textContent = 'NOMINAL'; hudStatus.style.color = '#00ff88'; }

    this.showText('MISSION CONTROL: "Believers-1, confirm cabin pressurization and interplanetary cruise diagnostics."', 300);
    this.showEducationalBanner('SPACE MISSION 5: HOHMANN TRANSFER CRUISE', '225,000,000 km interplanetary cruise trajectory toward Mars. Micro-meteoroid Whipple shielding active.');
    radioChatter();
    await this.sleep(3000);
    this.hideText();

    await this.sleep(600);
    this.showText('CO-PILOT: "Unbuckling to check flight telemetry and reactor seals. Stand by..."', 200);
    radioChatter();
    await this.sleep(3200);
    this.hideText();

    this.showText('<span style="color:#00ff88;">[DIAGNOSTICS]</span> LIFE SUPPORT: 100% &bull; PROPULSION: GREEN &bull; STABILIZATION: LOCKED', 200);
    tone(880, 0.1, 'sine', 0.1);
    await this.sleep(1200);
    tone(1200, 0.15, 'sine', 0.12);
    await this.sleep(2000);
    this.hideText();
  }

  /* -------------------------------------------------------------
     SCENE 5: ASTEROIDS INSIDE DISTANT WINDOW & EVASIVE BRAKING
     - Asteroids are strictly constrained INSIDE the distant circular window in the wall!
     - Spacecraft banks and pitches with RCS thruster sounds.
     - Asteroids slide past the glass.
     - Retro-thrusters engage with physical deceleration braking!
     ------------------------------------------------------------- */
  async sceneCockpitEvasiveManeuversAndBraking() {
    stopAmbientHum(0.5);

    this.setCamera(0, -10, 1.02);

    const hudStatus = document.getElementById('hud-status');
    if (hudStatus) { hudStatus.textContent = 'WARNING'; hudStatus.style.color = '#ff9900'; }

    startWarningAlarm();
    this.showText('⚠ PROXIMITY ALERT — DENSE ASTEROID BELT ON INTERCEPT VECTOR', 200);
    this.showEducationalBanner('SPACE MISSION 6: MAIN ASTEROID BELT TRANSIT', 'Passing through the Main Belt between Mars and Jupiter. Asteroids are Carbonaceous Chondrites (C-Type) and Silicates (S-Type).');
    await this.sleep(1800);
    this.hideText();

    // Open distant circular window viewport!
    this.windowFrameContainer.style.display = 'block';
    this.windowAsteroids.resize();
    this.windowAsteroids.spawnEvasiveSwarm();

    this.showText('PILOT: "Multiple contacts in distant viewport! Initiating defensive roll and evasion!"', 200);

    // Evasive maneuver 1: bank left (asteroids slide right!)
    rcsThrusterSound();
    this.setCamera(-22, -10, 1.02, 3.2);
    this.windowAsteroids.shipRollOffset = -35;
    this.cameraShake(5, 700);
    await this.sleep(1000);

    // Evasive maneuver 2: bank right (asteroids slide left!)
    rcsThrusterSound();
    this.setCamera(22, -18, 1.02, -3.2);
    this.windowAsteroids.shipRollOffset = 35;
    this.cameraShake(6, 700);
    await this.sleep(1000);

    // Emergency retro-braking
    stopWarningAlarm();
    this.showText('<span style="color:#ffcc00; font-weight:800;">[EMERGENCY RETRO-BRAKING] REVERSE ENGINES 100% &bull; DECELERATING G-FORCE</span>', 200);
    retroBrakingSound();

    this.setCamera(0, 15, 0.98, 0);
    this.windowAsteroids.shipRollOffset = 0;
    this.windowAsteroids.shipPitchOffset = 22;

    const hudVel = document.getElementById('hud-vel');
    if (hudVel) hudVel.textContent = '12.40 KM/S (BRAKING)';
    this.cameraShake(8, 1400);

    await this.sleep(600);
    if (hudVel) hudVel.textContent = '6.80 KM/S (BRAKING)';
    await this.sleep(700);
    if (hudVel) hudVel.textContent = '2.10 KM/S (CRITICAL)';
    this.hideText();
  }

  /* -------------------------------------------------------------
     SCENE 6: EXACTLY ONE ASTEROID HITS THE DISTANT WINDOW FRAME
     Synchronized physical collision right on the glass frame!
     ------------------------------------------------------------- */
  async sceneSingleAsteroidImpactAndTurbulence() {
    const hudStatus = document.getElementById('hud-status');
    if (hudStatus) { hudStatus.textContent = 'CRITICAL'; hudStatus.style.color = '#ff0033'; }

    this.showText('CO-PILOT: "ROGUE ASTEROID ON STARBOARD FRAME! WE CAN\'T CLEAR IT—"', 100);

    // Spawn rogue asteroid traveling directly to starboard window frame!
    let impactOccurred = false;

    await new Promise((resolve) => {
      this.windowAsteroids.spawnRogueAsteroid(() => {
        // Frame-perfect impact callback!
        impactOccurred = true;
        playCrash();
        this.flash(280);
        this.cameraShake(36, 2600);
        startSiren();

        this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.damage}')`;
        this.bgCurrent.style.filter = 'brightness(0.65) contrast(1.35) saturate(1.4)';

        // Spider-web glass cracks shatter right from that starboard frame!
        this.cracksEl.style.opacity = '0.95';

        // Emit ricocheting spark explosion off the circular frame
        const W = this.fxCanvas.width, H = this.fxCanvas.height;
        this.particles.emit(120, {
          x: W * 0.58, y: H * 0.44, spread: 220, spreadY: 140,
          angleMin: 0, angleMax: 360, speedMin: 90, speedMax: 380,
          lifeMin: 0.4, lifeMax: 2.2, sizeMin: 2, sizeMax: 6,
          colors: ['#ffffff', '#ffeedd', '#ff5500', '#ff0033', '#ffbb00']
        });

        resolve();
      });

      // Fallback timeout in case of unexpected timing
      setTimeout(() => { if (!impactOccurred) resolve(); }, 2200);
    });

    this.hideText();

    let blinkState = false;
    const blinkInterval = setInterval(() => {
      blinkState = !blinkState;
      this.vignetteEl.style.opacity = blinkState ? '1' : '0.15';
    }, 280);

    this.showText('<span style="color:#ff2222; font-weight:800;">CRITICAL HULL IMPACT &bull; STARBOARD STRUT BREACH</span>', 200);

    await this.sleep(3200);
    clearInterval(blinkInterval);
    this.vignetteEl.style.opacity = '0';
    this.cracksEl.style.opacity = '0';
    this.hideText();
    this.hudEl.style.opacity = '0';
    this.windowAsteroids.clear();
    this.windowFrameContainer.style.display = 'none';
  }

  /* -------------------------------------------------------------
     SCENE 7: SUDDEN BLACKOUT (BLANK SCREEN)
     ------------------------------------------------------------- */
  async sceneSuddenBlackout() {
    stopSiren(0.8);
    stopEngineRumble(0.4);

    this.bgCurrent.style.opacity = '0';
    this.bgNext.style.opacity = '0';
    this.particles.clear();

    cinematicBoom();
    await this.sleep(1200);

    startHeartbeat();

    this.showText('<span style="color:#8899aa; letter-spacing:0.3em;">. . .</span>', 200);
    await this.sleep(3000);
    this.hideText();
    await this.sleep(1200);

    stopHeartbeat();
  }

  /* -------------------------------------------------------------
     SCENE 8: FIRST-PERSON AWAKENING POV
     ------------------------------------------------------------- */
  async sceneAwakeningPOV() {
    startTinnitus(0.08);

    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.wakeup}')`;
    this.bgCurrent.style.filter = 'blur(28px) brightness(0.25) saturate(0.4)';
    this.bgCurrent.style.opacity = '1';

    // Eyelid blink 1
    this.eyelidsTop.style.transform = 'translateY(-30%)';
    this.eyelidsBottom.style.transform = 'translateY(30%)';
    await this.sleep(900);

    this.eyelidsTop.style.transform = 'translateY(0%)';
    this.eyelidsBottom.style.transform = 'translateY(0%)';
    await this.sleep(600);

    // Eyelid blink 2
    this.eyelidsTop.style.transform = 'translateY(-75%)';
    this.eyelidsBottom.style.transform = 'translateY(75%)';
    this.bgCurrent.style.filter = 'blur(16px) brightness(0.45) saturate(0.6)';
    await this.sleep(1200);

    this.showText('PILOT: "Ugh... what... what happened...?"', 200);
    await this.sleep(2000);
    this.hideText();

    // Full eye opening
    this.eyelidsTop.style.transform = 'translateY(-100%)';
    this.eyelidsBottom.style.transform = 'translateY(100%)';
    this.bgCurrent.style.filter = 'blur(6px) brightness(0.75) saturate(0.85)';
    await this.sleep(1200);

    stopTinnitus(2.5);

    this.bgCurrent.style.filter = 'blur(0px) brightness(1.0) saturate(1.0)';
    this.showText('<span style="color:#00e5ff;">LIFE SUPPORT STABILIZED &bull; EMERGENCY PLANETARY TOUCHDOWN CONFIRMED</span>', 200);
    await this.sleep(2800);
    this.hideText();
  }

  /* -------------------------------------------------------------
     SCENE 9: AVENGERS-STYLE CINEMATIC MARS LANDING RAMP OPENING
     (Video cutscene, not interaction! Hydraulic unlatch, heavy ramp
      drops open, golden-orange Martian sun & dust pour into cabin!)
     ------------------------------------------------------------- */
  async sceneAvengersMarsLandingHatchOpening() {
    this.bgCurrent.style.opacity = '0';
    await this.sleep(400);

    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.marsHatch}')`;
    this.bgCurrent.style.filter = 'brightness(0.3) contrast(1.2)';
    this.bgCurrent.style.opacity = '1';
    this.setCamera(0, 0, 1.08);

    this.showText('COMPUTER: "ATMOSPHERIC SENSORS: PLANET MARS. EXTERNAL PRESSURE: 0.006 ATM."', 200);
    radioChatter();
    await this.sleep(2500);
    this.hideText();

    this.showText('MISSION CONTROL: "Believers-1, landing ramp unlocked. Open the hatch and begin EVA."', 200);
    radioChatter();
    await this.sleep(3000);
    this.hideText();

    // HYDRAULIC UNLATCH & RAMP LOWERING
    hydraulicHatchOpenSound();
    this.cameraShake(6, 1200);

    // Golden Martian sunlight floods the cabin as door opens!
    this.flash(200);
    this.bgCurrent.style.filter = 'brightness(1.1) contrast(1.15) saturate(1.2)';
    this.setCamera(0, 15, 1.15);

    const W = this.fxCanvas.width, H = this.fxCanvas.height;
    for (let b = 0; b < 6; b++) {
      this.particles.emit(35, {
        x: W * 0.5, y: H * 0.55, spread: 200, spreadY: 80,
        angleMin: -40, angleMax: 40, speedMin: 80, speedMax: 260,
        lifeMin: 1.2, lifeMax: 3.0, sizeMin: 2, sizeMax: 6,
        colors: ['#ff8833', '#ffa555', '#dd6622', '#eeddcc']
      });
      await this.sleep(200);
    }

    this.showText('<span style="color:#ffaa44; font-size:1.4rem; font-weight:900; letter-spacing:0.2em;">WELCOME TO MARS</span><br><span style="color:#00ff88; font-size:0.9rem; letter-spacing:0.15em;">LANDING RAMP FULLY EXTENDED</span>', 200);
    await this.sleep(3500);
    this.hideText();

    this.bgCurrent.style.transition = 'opacity 1.5s ease, transform 2.0s ease';
    this.bgCurrent.style.transform = 'scale(1.25)';
    this.bgCurrent.style.opacity = '0';
    await this.sleep(1600);
  }
}

/* ================================================================
   6. GLOBAL ENTRY POINT
   ================================================================ */
window.startCinematicIntro = function(onComplete) {
  preloadImages().then(() => {
    const intro = new CinematicIntro();
    intro.play(onComplete || (() => {}));
  });
};
