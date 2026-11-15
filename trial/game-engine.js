/**
 * BELIEVERS STUDIOS — REAL 3D FIRST-PERSON MARS SURVIVAL & SCIENCE ENGINE
 * =======================================================================
 * Complete physical simulation & educational planetary exploration:
 * 
 * 1. REAL SOLID OBSTACLE & WALL COLLISION PHYSICS:
 *    - Solid physical colliders for all spaceship walls, bulkheads, crates, and benches.
 *    - Solid spherical/cylindrical collision for every stone boulder and structure on Mars.
 *    - Player CANNOT walk through walls or stones: elastic contact resolution and sliding.
 *    - Exact terrain elevation heightmap parity: no clipping through soil or floating.
 * 
 * 2. DIRECTIONAL RADAR & 3D BEACON NAVIGATION:
 *    - 80-meter tall volumetric vertical light beams pointing into the Martian sky at objectives!
 *    - Interactive 360° Rotating Radar HUD with blips for North [N], Rover, Probe, Monolith.
 *    - Dynamic Helmet Compass Waypoint Ribbon with distance and heading angle.
 * 
 * 3. 7 EDUCATIONAL SCIENTIFIC MISSIONS (LEARNING THROUGH EXPLORATION):
 *    - Mission 1: Atmospheric Calibration & The Armstrong Limit (610 Pa vs 101.3 kPa).
 *    - Mission 2: Low-Gravity Calibration (0.38g / 3.72 m/s²).
 *    - Mission 3: Rover Power & Radioactive Thermoelectric Generators (RTG).
 *    - Mission 4: Subsurface Glacial Ice & The Sabatier Rocket Fuel Reaction.
 *    - Mission 5: Cataclysmic Outflow Mega-Floods of Chryse Planitia (3.5 Billion Yrs).
 *    - Mission 6: Cosmic Radiation Dosage & Dynamo Magnetosphere Extinction.
 *    - Mission 7: Establish Chryse Base Alpha (Plant Believers Flag).
 * 
 * 4. REAL 3D ASTRONAUT ARMS & HELD TOOLS:
 *    - Fully articulated 3D spacesuit arms with dynamic walk-sway and [E] reach animations.
 *    - Astronaut physically holds the active tool/item in their hand in first person!
 */

'use strict';

class BelieversMars3DGame {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.active = false;
    this.rafId = null;

    // Movement & Physics
    this.moveSpeed = 7.0;
    this.sprintSpeed = 12.5;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.playerPos = { x: 0, y: 1.7, z: 8 }; // starts inside cargo bay
    this.yaw = 0;
    this.pitch = 0;
    this.keys = {};
    this.isLocked = false;
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.stepTimer = 0;
    this.isGrounded = true;
    this.gravity = 9.8 * 0.38; // 3.72 m/s² (Mars gravity)

    // Solid Physics Obstacles (Walls, Crates, Rocks, Structures)
    this.obstacles = [];

    // Interactive World Entities
    this.interactables = [];
    this.currentLookTarget = null;
    this.rampDoor = null;
    this.rampAngle = -0.42;
    this.targetRampAngle = -0.42;

    // Navigation & Radar Beacon Beams
    this.beaconProbe = null;
    this.beaconRover = null;
    this.beaconMonolith = null;
    this.beaconSummit = null;

    // First-Person 3D Astronaut Hands & Arm Rig
    this.handsRig = null;
    this.leftArm = null;
    this.rightArm = null;
    this.heldItemMount = null;
    this.heldItemMeshes = {};
    this.reachAnim = 0;

    // Inventory & Missions
    this.inventory = [];
    this.selectedItemIndex = 0;
    this.missionStep = 1;

    // Vitals & Helmet Systems
    this.o2 = 98.4;
    this.pulse = 74;
    this.flashlightOn = false;
    this.spotlight3D = null;
    this.particles = null;

    // Rover entity references
    this.roverDish = null;
    this.roverLight = null;
    this.roverFixed = false;

    // Audio
    this.audioCtx = null;
    this.windSource = null;

    // Educational Guide Modal
    this.guideOpen = false;
  }

  /* ================================================================
     1. EXACT MATHEMATICAL TERRAIN HEIGHTMAP (NO CLIPPING UNDER SOIL)
     ================================================================ */
  getTerrainHeight(x, z) {
    // 1. Inside spaceship cargo bay: Solid level metal deck at Y = 0
    if (z > -4 && Math.abs(x) < 5.8) {
      return 0.0;
    }
    // 2. On the hydraulic ramp: Smooth continuous incline from Y = 0 down to soil at z = -14
    if (z <= -4 && z >= -14.0 && Math.abs(x) < 2.5) {
      const progress = (-z - 4) / 10.0;
      const soilAtFoot = this.getMarsSoilElevation(x, -14.0);
      return (1.0 - progress) * 0.0 + progress * soilAtFoot;
    }
    // 3. Open Mars Surface
    return this.getMarsSoilElevation(x, z);
  }

  getMarsSoilElevation(x, z) {
    const distFromShip = Math.hypot(x, z - 6);
    if (distFromShip < 14) {
      return -0.05;
    }
    const dune1 = Math.sin(x * 0.04) * Math.cos(z * 0.035) * 3.8;
    const dune2 = Math.sin(x * 0.015 + z * 0.02) * 5.5;

    const craterDist = Math.hypot(x - 25, z + 45);
    let craterDip = 0;
    if (craterDist < 30) {
      craterDip = -Math.cos((craterDist / 30) * Math.PI) * 4.2;
    }

    const ridgeDist = Math.hypot(x + 35, z + 55);
    let ridgeRise = 0;
    if (ridgeDist < 35) {
      ridgeRise = Math.cos((ridgeDist / 35) * (Math.PI / 2)) * 8.5;
    }

    return dune1 + dune2 + craterDip + ridgeRise;
  }

  /* ================================================================
     2. SOLID OBSTACLE & WALL COLLISION RESOLUTION (NO GOING THROUGH WALLS/STONES)
     ================================================================ */
  resolveCollisions(playerRadius = 0.5) {
    // A. Spaceship Interior Boundaries (Solid Outer Bulkhead Walls)
    if (this.playerPos.z > -4 && this.playerPos.z < 19.5) {
      if (this.playerPos.x < -5.2 + playerRadius) this.playerPos.x = -5.2 + playerRadius;
      if (this.playerPos.x > 5.2 - playerRadius) this.playerPos.x = 5.2 - playerRadius;
      if (this.playerPos.z > 19.2 - playerRadius) this.playerPos.z = 19.2 - playerRadius;
    }

    // Airlock Doorframe Partition at z = -4.0 (Only central doorway open: |x| < 2.2)
    if (this.playerPos.z >= -4.4 && this.playerPos.z <= -3.6) {
      if (Math.abs(this.playerPos.x) > 2.2) {
        if (this.playerPos.z > -4.0) this.playerPos.z = -3.6 + playerRadius;
        else this.playerPos.z = -4.4 - playerRadius;
      }
    }

    // B. Obstacle Colliders (Every Stone Boulder, Crate, Workbench, Structure)
    for (const obs of this.obstacles) {
      const dx = this.playerPos.x - obs.x;
      const dz = this.playerPos.z - obs.z;
      const dist = Math.hypot(dx, dz);
      const minDist = obs.radius + playerRadius;

      if (dist < minDist && dist > 0.0001) {
        // Physical push-out normal vector
        const push = minDist - dist;
        const nx = dx / dist;
        const nz = dz / dist;

        this.playerPos.x += nx * push;
        this.playerPos.z += nz * push;

        // Strip velocity component into the stone/wall (smooth sliding physics!)
        const dot = this.velocity.x * nx + this.velocity.z * nz;
        if (dot < 0) {
          this.velocity.x -= dot * nx;
          this.velocity.z -= dot * nz;
        }
      }
    }
  }

  /* ================================================================
     3. INITIALIZATION & THREE.JS SETUP
     ================================================================ */
  init(containerId = 'game-canvas-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }

    this.container.innerHTML = '';
    this.container.style.cssText = `
      position: fixed; inset: 0; width: 100vw; height: 100vh;
      z-index: 100; display: none; overflow: hidden; background: #000;
      user-select: none;
    `;

    // 1. THREE.JS SCENE, FOG & RENDERER
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd1693f);
    this.scene.fog = new THREE.FogExp2(0xd1693f, 0.012);

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 550);
    this.camera.position.set(this.playerPos.x, this.playerPos.y, this.playerPos.z);
    this.camera.rotation.order = 'YXZ';

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 2. SUN & ATMOSPHERIC LIGHTING
    const sunLight = new THREE.DirectionalLight(0xffecd0, 1.4);
    sunLight.position.set(80, 120, -90);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    this.scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xb5532b, 0.65);
    this.scene.add(ambientLight);

    // Helmet Tactical Floodlight
    const helmetLight = new THREE.SpotLight(0xffffff, 2.5, 35, Math.PI / 4, 0.35, 1.2);
    helmetLight.position.set(0, 0, 0);
    this.camera.add(helmetLight);
    helmetLight.target = new THREE.Object3D();
    helmetLight.target.position.set(0, 0, -10);
    this.camera.add(helmetLight.target);
    helmetLight.visible = false;
    this.spotlight3D = helmetLight;

    // 3. ATTACH REAL 3D ASTRONAUT ARMS & HANDS
    this.buildAstronautHands();
    this.scene.add(this.camera);

    // 4. BUILD 3D WORLD
    this.buildSpaceshipInterior();
    this.buildMarsSurface();
    this.buildInteractableItems();
    this.buildDustParticles();

    // 5. BUILD HUD, COMPASS WAYPOINT & ROTATING RADAR
    this.buildHUD();
    this.buildEducationalFieldGuide();

    // 6. INPUT LISTENERS
    this.setupControls();

    window.addEventListener('resize', () => {
      if (!this.renderer || !this.camera) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /* ================================================================
     4. 3D ASTRONAUT ARMS & ARTICULATED GLOVED HANDS RIG
     ================================================================ */
  buildAstronautHands() {
    const handsRig = new THREE.Group();
    handsRig.position.set(0, -0.32, -0.52);
    this.camera.add(handsRig);
    this.handsRig = handsRig;

    const suitMat = new THREE.MeshStandardMaterial({ color: 0xefede8, roughness: 0.65, metalness: 0.15 });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.85, roughness: 0.25 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.1 });

    const buildArm = (isLeft) => {
      const armGroup = new THREE.Group();
      const side = isLeft ? -1 : 1;
      armGroup.position.set(side * 0.32, -0.10, 0);
      armGroup.rotation.y = side * 0.12;
      armGroup.rotation.x = 0.22;

      // Forearm Sleeve
      const forearmGeo = new THREE.CylinderGeometry(0.075, 0.09, 0.48, 16);
      forearmGeo.rotateX(Math.PI / 2.3);
      const forearm = new THREE.Mesh(forearmGeo, suitMat);
      forearm.position.set(0, -0.04, 0.18);
      forearm.castShadow = true;
      armGroup.add(forearm);

      // Mission Stripe
      const stripeGeo = new THREE.CylinderGeometry(0.078, 0.078, 0.04, 16);
      stripeGeo.rotateX(Math.PI / 2.3);
      const stripe = new THREE.Mesh(stripeGeo, isLeft ? ringMat : goldMat);
      stripe.position.set(0, 0.06, 0.0);
      armGroup.add(stripe);

      // Wrist Ring
      const wristRing = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.03, 16), ringMat);
      wristRing.rotateX(Math.PI / 2.3);
      wristRing.position.set(0, 0.08, -0.03);
      armGroup.add(wristRing);

      // Palm
      const palmGroup = new THREE.Group();
      palmGroup.position.set(0, 0.11, -0.09);
      const palmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.12), gloveMat);
      palmMesh.castShadow = true;
      palmGroup.add(palmMesh);

      // Thumb
      const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.036, 0.08), gloveMat);
      thumb.position.set(side * 0.06, 0.01, -0.02);
      thumb.rotation.y = side * 0.55;
      thumb.rotation.x = -0.15;
      palmGroup.add(thumb);

      // Fingers
      [-0.036, -0.012, 0.012, 0.036].forEach((fx) => {
        const finger = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.028, 0.075), gloveMat);
        finger.position.set(fx, -0.005, -0.085);
        finger.rotation.x = -0.45;
        palmGroup.add(finger);
      });

      armGroup.add(palmGroup);
      return { armGroup, palmGroup };
    };

    this.leftArm = buildArm(true);
    handsRig.add(this.leftArm.armGroup);

    this.rightArm = buildArm(false);
    handsRig.add(this.rightArm.armGroup);

    this.heldItemMount = new THREE.Group();
    this.heldItemMount.position.set(0, 0.02, -0.10);
    this.rightArm.palmGroup.add(this.heldItemMount);

    this.buildHeldItemMeshes();
  }

  buildHeldItemMeshes() {
    // 1. HELD POWER CELL
    const cellGroup = new THREE.Group();
    const cellMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 })
    );
    cellGroup.add(cellMesh);
    const cellGlow = new THREE.PointLight(0x00f0ff, 1.2, 1.5);
    cellGroup.add(cellGlow);
    cellGroup.visible = false;
    this.heldItemMount.add(cellGroup);
    this.heldItemMeshes['rover_core'] = cellGroup;

    // 2. HELD EVA SCANNER
    const scanGroup = new THREE.Group();
    const scanBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.05, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
    );
    scanGroup.add(scanBody);
    const scanScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.08), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    scanScreen.rotation.x = -Math.PI / 2;
    scanScreen.position.set(0, 0.026, -0.02);
    scanGroup.add(scanScreen);
    scanGroup.visible = false;
    this.heldItemMount.add(scanGroup);
    this.heldItemMeshes['eva_scanner'] = scanGroup;

    // 3. HELD MISSION FLAG
    const flagGroup = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.55), new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.9 }));
    flagGroup.add(pole);
    const flagCloth = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.01), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    flagCloth.position.set(0.13, 0.16, 0);
    flagGroup.add(flagCloth);
    flagGroup.visible = false;
    this.heldItemMount.add(flagGroup);
    this.heldItemMeshes['mission_flag'] = flagGroup;

    // 4. HELD BLACK BOX
    const boxGroup = new THREE.Group();
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.11), new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.7 }));
    boxGroup.add(boxMesh);
    boxGroup.visible = false;
    this.heldItemMount.add(boxGroup);
    this.heldItemMeshes['black_box'] = boxGroup;
  }

  updateHeldItemMesh() {
    const curItem = this.inventory[this.selectedItemIndex];
    Object.values(this.heldItemMeshes).forEach(m => m.visible = false);

    if (curItem && this.heldItemMeshes[curItem.id]) {
      this.heldItemMeshes[curItem.id].visible = true;
    }
  }

  /* ================================================================
     5. 3D WORLD: SPACESHIP + HYDRAULIC RAMP + MARS WITH OBSTACLES
     ================================================================ */
  buildSpaceshipInterior() {
    const shipGroup = new THREE.Group();
    shipGroup.position.set(0, 0, 0);

    const floorGeo = new THREE.PlaneGeometry(12, 24);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x333b45, roughness: 0.6, metalness: 0.85 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 8);
    floor.receiveShadow = true;
    shipGroup.add(floor);

    const ceilGeo = new THREE.PlaneGeometry(12, 24);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.8 });
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 3.8, 8);
    shipGroup.add(ceil);

    const wallGeo = new THREE.PlaneGeometry(24, 3.8);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x28303c, roughness: 0.7, metalness: 0.6 });
    
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-6, 1.9, 8);
    leftWall.rotation.y = Math.PI / 2;
    shipGroup.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(6, 1.9, 8);
    rightWall.rotation.y = -Math.PI / 2;
    shipGroup.add(rightWall);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.8), wallMat);
    backWall.position.set(0, 1.9, 20);
    backWall.rotation.y = Math.PI;
    shipGroup.add(backWall);

    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.8, 0.4), wallMat);
    frontWallLeft.position.set(-4.25, 1.9, -4);
    shipGroup.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.8, 0.4), wallMat);
    frontWallRight.position.set(4.25, 1.9, -4);
    shipGroup.add(frontWallRight);

    const frontWallTop = new THREE.Mesh(new THREE.BoxGeometry(5, 1.0, 0.4), wallMat);
    frontWallTop.position.set(0, 3.3, -4);
    shipGroup.add(frontWallTop);

    const redLight = new THREE.PointLight(0xff3322, 1.2, 14);
    redLight.position.set(-4.5, 3.2, 14);
    shipGroup.add(redLight);

    const amberLight = new THREE.PointLight(0xffaa22, 1.4, 18);
    amberLight.position.set(4.5, 3.2, 2);
    shipGroup.add(amberLight);

    // Crates (Add to solid obstacles!)
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x5a6578, metalness: 0.5, roughness: 0.6 });
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), crateMat);
    crate1.position.set(-4.2, 0.6, 12);
    crate1.castShadow = true;
    crate1.receiveShadow = true;
    shipGroup.add(crate1);

    const crate2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.4), crateMat);
    crate2.position.set(-4.0, 1.7, 12);
    crate2.castShadow = true;
    shipGroup.add(crate2);
    this.obstacles.push({ x: -4.1, z: 12, radius: 1.3, type: 'crate' });

    // Workbench (Solid obstacle!)
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 4.0), benchMat);
    bench.position.set(5.1, 0.45, 10);
    bench.castShadow = true;
    shipGroup.add(bench);
    this.obstacles.push({ x: 5.1, z: 10, radius: 1.7, type: 'workbench' });

    // Locker (Solid obstacle!)
    const locker = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.5, 0.6), crateMat);
    locker.position.set(0, 1.25, 19.5);
    locker.castShadow = true;
    shipGroup.add(locker);
    this.obstacles.push({ x: 0, z: 19.3, radius: 1.2, type: 'locker' });

    // Hydraulic ramp
    const rampPivot = new THREE.Group();
    rampPivot.position.set(0, 0, -4);

    const rampMesh = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 0.25, 10.0),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.4 })
    );
    rampMesh.position.set(0, 0, -5.0);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    rampPivot.add(rampMesh);

    const hazardMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const lineL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.28, 10.0), hazardMat);
    lineL.position.set(-2.4, 0.02, -5.0);
    rampPivot.add(lineL);
    const lineR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.28, 10.0), hazardMat);
    lineR.position.set(2.4, 0.02, -5.0);
    rampPivot.add(lineR);

    rampPivot.rotation.x = -0.42;
    shipGroup.add(rampPivot);
    this.rampDoor = rampPivot;

    this.scene.add(shipGroup);
  }

  buildMarsSurface() {
    const terrainGeo = new THREE.PlaneGeometry(360, 360, 100, 100);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, this.getMarsSoilElevation(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x9e381b,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true
    });

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.set(0, 0, 0);
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    // 75 SOLID BASALT BOULDERS (REGISTERED AS PHYSICAL OBSTACLES)
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x4d1d11, roughness: 0.9, flatShading: true });
    
    // Deterministic rock placement away from ship pathway
    for (let r = 0; r < 75; r++) {
      const angle = (r / 75) * Math.PI * 2 + (r % 5) * 0.4;
      const dist = 18 + ((r * 13) % 135);
      const rx = Math.cos(angle) * dist;
      const rz = -15 - Math.abs(Math.sin(angle) * dist);
      const s = 0.8 + ((r % 7) * 0.35);

      const soilY = this.getMarsSoilElevation(rx, rz);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.scale.set(s, s * 0.7, s);
      rock.position.set(rx, soilY + s * 0.35, rz);
      rock.rotation.set((r * 0.4), (r * 0.7), (r * 0.2));
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);

      // Register solid physics collider for this stone!
      this.obstacles.push({ x: rx, z: rz, radius: s * 1.15, type: 'stone' });
    }

    // Anchored Landmarks with solid colliders & volumetric navigation beams
    const roverY = this.getMarsSoilElevation(6, -18);
    this.buildStrandedRover(6, roverY, -18);
    this.obstacles.push({ x: 6, z: -18, radius: 2.2, type: 'rover' });

    // NORTH CRASHED PROBE (65m North) WITH TOWERING 80M VOLUMETRIC SKY BEACON
    const probeY = this.getMarsSoilElevation(-28, -65);
    this.buildCrashedProbe(-28, probeY, -65);
    this.obstacles.push({ x: -28, z: -65, radius: 2.6, type: 'probe' });

    // Alien Monolith (South crater)
    const monoY = this.getMarsSoilElevation(25, -45);
    this.buildAlienMonolith(25, monoY, -45);
    this.obstacles.push({ x: 25, z: -45, radius: 2.4, type: 'monolith' });

    // Chryse Summit Pedestal (North-East)
    const summitY = this.getMarsSoilElevation(-35, -55);
    this.buildSummitPedestal(-35, summitY, -55);
    this.obstacles.push({ x: -35, z: -55, radius: 2.5, type: 'pedestal' });
  }

  /* --- VOLUMETRIC 3D SKY BEACON BEAM (Visible from miles away!) --- */
  createSkyBeacon(x, y, z, colorHex) {
    const beamGroup = new THREE.Group();
    beamGroup.position.set(x, y, z);

    // 80-meter vertical holographic light pillar
    const beamGeo = new THREE.CylinderGeometry(0.5, 1.8, 90, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 45;
    beamGroup.add(beam);

    // Glowing core light
    const pLight = new THREE.PointLight(colorHex, 3.5, 30);
    pLight.position.y = 2;
    beamGroup.add(pLight);

    this.scene.add(beamGroup);
    return beamGroup;
  }

  buildStrandedRover(x, y, z) {
    const roverGroup = new THREE.Group();
    roverGroup.position.set(x, y, z);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.8, 3.2),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.3 })
    );
    body.position.y = 0.8;
    body.castShadow = true;
    roverGroup.add(body);

    const solar = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.08, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.1 })
    );
    solar.position.y = 1.25;
    roverGroup.add(solar);

    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    [-1.3, 1.3].forEach(wx => {
      [-1.2, 0, 1.2].forEach(wz => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(wx, 0.45, wz);
        wheel.castShadow = true;
        roverGroup.add(wheel);
      });
    });

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2), new THREE.MeshStandardMaterial({ color: 0x64748b }));
    mast.position.set(0.6, 1.8, -0.8);
    roverGroup.add(mast);

    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.25, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    dish.position.set(0.6, 2.4, -0.8);
    dish.rotation.x = 0.6;
    roverGroup.add(dish);
    this.roverDish = dish;

    const rLight = new THREE.SpotLight(0x00f0ff, 0, 20, Math.PI / 4);
    rLight.position.set(0, 1.0, -1.6);
    roverGroup.add(rLight);
    this.roverLight = rLight;

    this.scene.add(roverGroup);

    // Rover Navigation Beacon (Yellow)
    this.beaconRover = this.createSkyBeacon(x, y, z, 0xfacc15);
  }

  buildCrashedProbe(x, y, z) {
    const probeGroup = new THREE.Group();
    probeGroup.position.set(x, y, z);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.1, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 })
    );
    body.rotation.z = 1.1;
    body.castShadow = true;
    probeGroup.add(body);

    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.2, 3.5),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 })
    );
    panel.position.set(0.8, 0.4, 0);
    panel.rotation.y = 0.5;
    probeGroup.add(panel);

    const beacon = new THREE.PointLight(0x00ff88, 3.0, 16);
    beacon.position.set(0, 1.4, 0);
    probeGroup.add(beacon);
    this.probeBeacon = beacon;

    this.scene.add(probeGroup);

    // TOWERING NORTH SKY BEACON PILLAR (CYAN / GREEN)
    this.beaconProbe = this.createSkyBeacon(x, y, z, 0x00ff88);
  }

  buildAlienMonolith(x, y, z) {
    const monoGroup = new THREE.Group();
    monoGroup.position.set(x, y, z);

    const monoGeo = new THREE.BoxGeometry(2.4, 9.6, 1.2);
    const monoMat = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.1, metalness: 0.95 });
    const monoMesh = new THREE.Mesh(monoGeo, monoMat);
    monoMesh.position.y = 4.8;
    monoMesh.castShadow = true;
    monoGroup.add(monoMesh);

    const coreLight = new THREE.PointLight(0xd946ef, 3.0, 20);
    coreLight.position.set(0, 4.8, 1.4);
    monoGroup.add(coreLight);
    this.monolithLight = coreLight;

    this.scene.add(monoGroup);

    // Purple Beacon
    this.beaconMonolith = this.createSkyBeacon(x, y, z, 0xd946ef);
  }

  buildSummitPedestal(x, y, z) {
    const pedGroup = new THREE.Group();
    pedGroup.position.set(x, y, z);

    const pedMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.5, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x2e1810, roughness: 0.9 })
    );
    pedMesh.position.y = 0.4;
    pedMesh.receiveShadow = true;
    pedGroup.add(pedMesh);

    const ringGeo = new THREE.RingGeometry(0.8, 1.2, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide }));
    ringMesh.position.y = 0.82;
    pedGroup.add(ringMesh);

    this.scene.add(pedGroup);

    // Red Summit Beacon
    this.beaconSummit = this.createSkyBeacon(x, y, z, 0xef4444);
  }

  /* ================================================================
     6. INTERACTIVE ITEMS & SCIENTIFIC MISSIONS
     ================================================================ */
  buildInteractableItems() {
    // 1. ROVER POWER CORE
    const coreGroup = new THREE.Group();
    coreGroup.position.set(-4.0, 2.3, 12);
    const coreMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.45, 16),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 })
    );
    coreGroup.add(coreMesh);
    const coreGlow = new THREE.PointLight(0x00f0ff, 1.4, 4);
    coreGroup.add(coreGlow);
    this.scene.add(coreGroup);

    this.interactables.push({
      id: 'rover_core',
      name: 'ROVER POWER CORE',
      mesh: coreGroup,
      radius: 2.2,
      action: 'PICK UP ROVER POWER CORE',
      onInteract: () => this.collectItem('rover_core', '⚡ ROVER CORE')
    });

    // 2. EVA GEOLOGICAL SCANNER
    const scanGroup = new THREE.Group();
    scanGroup.position.set(5.1, 1.0, 10);
    const scanMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.12, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.7, roughness: 0.3 })
    );
    scanGroup.add(scanMesh);
    const scanGlow = new THREE.PointLight(0x22c55e, 1.0, 3);
    scanGroup.add(scanGlow);
    this.scene.add(scanGroup);

    this.interactables.push({
      id: 'eva_scanner',
      name: 'EVA GEOLOGICAL SCANNER',
      mesh: scanGroup,
      radius: 2.2,
      action: 'PICK UP EVA SCANNER',
      onInteract: () => this.collectItem('eva_scanner', '🔬 EVA SCANNER')
    });

    // 3. BELIEVERS EXPEDITION FLAG
    const flagCase = new THREE.Group();
    flagCase.position.set(0, 1.4, 19.1);
    const caseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.25, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.8 })
    );
    flagCase.add(caseMesh);
    this.scene.add(flagCase);

    this.interactables.push({
      id: 'mission_flag',
      name: 'BELIEVERS MISSION FLAG',
      mesh: flagCase,
      radius: 2.5,
      action: 'RETRIEVE MISSION FLAG',
      onInteract: () => this.collectItem('mission_flag', '🚩 MISSION FLAG')
    });

    // 4. STRANDED MARS ROVER
    const roverY = this.getMarsSoilElevation(6, -18);
    this.interactables.push({
      id: 'rover_target',
      name: 'STRANDED MARS ROVER',
      mesh: { position: new THREE.Vector3(6, roverY + 0.8, -18) },
      radius: 3.5,
      action: 'INSTALL POWER CORE & REBOOT ROVER',
      onInteract: () => this.solveRoverReboot()
    });

    // 5. CRASHED RECON PROBE BLACK BOX (NORTH)
    const probeY = this.getMarsSoilElevation(-28, -65);
    this.interactables.push({
      id: 'black_box',
      name: 'CRASHED RECON PROBE (NORTH)',
      mesh: { position: new THREE.Vector3(-28, probeY + 1.2, -65) },
      radius: 3.5,
      action: 'RETRIEVE FLIGHT RECORDER (BLACK BOX)',
      onInteract: () => this.solveCrashedProbe()
    });

    // 6. ANCIENT ALIEN MONOLITH
    const monoY = this.getMarsSoilElevation(25, -45);
    this.interactables.push({
      id: 'monolith',
      name: 'ANCIENT MONOLITH',
      mesh: { position: new THREE.Vector3(25, monoY + 3.0, -45) },
      radius: 4.5,
      action: 'SCAN ALIEN HIEROGLYPHS (EVA SCANNER)',
      onInteract: () => this.solveMonolithScan()
    });

    // 7. CHRYSE SUMMIT FLAG PEDESTAL
    const summitY = this.getMarsSoilElevation(-35, -55);
    this.interactables.push({
      id: 'summit_flag',
      name: 'CHRYSE RIDGE SUMMIT',
      mesh: { position: new THREE.Vector3(-35, summitY + 0.8, -55) },
      radius: 3.8,
      action: 'PLANT BELIEVERS MISSION FLAG',
      onInteract: () => this.solvePlantFlag()
    });
  }

  buildDustParticles() {
    const count = 400;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 140;
      positions[i + 1] = Math.random() * 16;
      positions[i + 2] = (Math.random() - 0.5) * 140;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({ color: 0xdd6633, size: 0.18, transparent: true, opacity: 0.65 });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  /* ================================================================
     7. 2D HUD: COMPASS WAYPOINT RIBBON, ROTATING RADAR & VITALS
     ================================================================ */
  buildHUD() {
    const hud = document.createElement('div');
    hud.id = 'fp-game-hud';
    hud.style.cssText = `
      position: absolute; inset: 0; pointer-events: none; z-index: 50;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
      box-shadow: inset 0 0 90px 25px rgba(0, 15, 30, 0.65);
    `;

    hud.innerHTML = `
      <!-- TOP COMPASS & OBJECTIVE WAYPOINT RIBBON -->
      <div style="position:absolute; top:12px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center;">
        <div style="background:rgba(6,18,32,0.85); border:1px solid rgba(0,229,255,0.4); padding:6px 24px; border-radius:30px; display:flex; align-items:center; gap:16px; font-size:0.8rem; font-weight:900; letter-spacing:0.15em; color:#fff; backdrop-filter:blur(6px); box-shadow:0 0 20px rgba(0,229,255,0.25);">
          <span>W</span> &bull; <span>NW</span> &bull; <span style="color:#00ff88; font-size:1.0rem;">[N] NORTH</span> &bull; <span>NE</span> &bull; <span>E</span> &bull; <span>SE</span> &bull; <span>S</span> &bull; <span>SW</span>
        </div>
        <!-- Live Active Objective Waypoint -->
        <div id="hud-nav-pin" style="margin-top:6px; background:rgba(0,255,136,0.92); color:#000; font-size:0.75rem; font-weight:900; letter-spacing:0.12em; padding:4px 14px; border-radius:4px; box-shadow:0 0 15px rgba(0,255,136,0.6);">
          ▲ RECON PROBE BEACON: NORTH (-65m)
        </div>
      </div>

      <!-- Reticle -->
      <div id="hud-reticle" style="
        position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);
        width:12px; height:12px; border-radius:50%;
        border:2px solid rgba(255, 255, 255, 0.7);
        transition: all 0.15s ease;
      "></div>
      
      <!-- Interactive Prompt -->
      <div id="hud-prompt" style="
        position:absolute; top:55%; left:50%; transform:translateX(-50%);
        background:rgba(6, 18, 32, 0.88); border:1px solid #00e5ff;
        color:#00ff88; font-size:0.85rem; font-weight:900; letter-spacing:0.12em;
        padding:8px 20px; border-radius:6px; box-shadow:0 0 20px rgba(0,229,255,0.4);
        display:none; text-align:center;
      "></div>

      <!-- Top Left: Mission Objective & Educational Card -->
      <div style="position:absolute; top:24px; left:28px; background:rgba(6,18,32,0.85); border:1px solid rgba(255,140,40,0.6); padding:14px 22px; border-radius:8px; backdrop-filter:blur(6px); max-width:420px;">
        <div style="font-size:0.7rem; font-weight:900; letter-spacing:0.2em; color:#ff9933;">
          EXPEDITION SCIENCE MISSION &bull; STEP <span id="hud-step-num">1</span>/7
        </div>
        <div id="hud-mission-title" style="font-size:1.0rem; font-weight:900; color:#ffffff; margin-top:2px;">
          GEAR UP IN THE SPACESHIP
        </div>
        <div id="hud-mission-desc" style="font-size:0.75rem; color:#aaccdd; margin-top:4px; line-height:1.4;">
          Collect the EVA Scanner, Rover Core, and Mission Flag before stepping down the ramp onto Mars.
        </div>
      </div>

      <!-- Top Right: Telemetry & Rotating Radar Scanner -->
      <div style="position:absolute; top:24px; right:28px; display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
        <div style="background:rgba(6,18,32,0.85); border:1px solid rgba(0,210,255,0.4); padding:12px 18px; border-radius:8px; backdrop-filter:blur(6px); text-align:right;">
          <div style="font-size:0.7rem; font-weight:800; letter-spacing:0.18em; color:#00e5ff;">SUIT TELEMETRY</div>
          <div style="font-size:1.05rem; font-weight:900; color:#00ff88; margin-top:2px;">
            O₂: <span id="hud-o2">98.4%</span> &bull; PULSE: <span id="hud-pulse">74</span> BPM
          </div>
          <div style="font-size:0.72rem; color:#88aacc; margin-top:2px;">
            GRAV: 0.38g &bull; ELEV: <span id="hud-elev-txt">0.0m</span> &bull; <span id="hud-light-txt" style="color:#888;">[F] LIGHT</span>
          </div>
        </div>

        <!-- ROTATING MARTIAN RADAR MINI-DISPLAY -->
        <div style="position:relative; width:130px; height:130px; background:rgba(6,18,32,0.88); border:2px solid #00e5ff; border-radius:50%; overflow:hidden; box-shadow:0 0 20px rgba(0,229,255,0.35);">
          <!-- Crosshairs -->
          <div style="position:absolute; top:50%; left:0; width:100%; height:1px; background:rgba(0,229,255,0.3);"></div>
          <div style="position:absolute; top:0; left:50%; width:1px; height:100%; background:rgba(0,229,255,0.3);"></div>
          <!-- Range Rings -->
          <div style="position:absolute; top:20%; left:20%; width:60%; height:60%; border:1px dashed rgba(0,229,255,0.25); border-radius:50%;"></div>
          <!-- North Indicator -->
          <div style="position:absolute; top:4px; left:50%; transform:translateX(-50%); font-size:0.65rem; font-weight:900; color:#00ff88;">[N]</div>
          <!-- Center Player Blip -->
          <div style="position:absolute; top:50%; left:50%; width:6px; height:6px; background:#fff; border-radius:50%; transform:translate(-50%, -50%); box-shadow:0 0 6px #fff;"></div>
          <!-- Probe Radar Blip (North) -->
          <div id="radar-blip-probe" style="position:absolute; top:22%; left:42%; width:8px; height:8px; background:#00ff88; border-radius:50%; transform:translate(-50%, -50%); box-shadow:0 0 10px #00ff88; animation:radarPulse 1.2s infinite;"></div>
          <!-- Rover Blip -->
          <div id="radar-blip-rover" style="position:absolute; top:42%; left:56%; width:7px; height:7px; background:#facc15; border-radius:50%; transform:translate(-50%, -50%); box-shadow:0 0 8px #facc15;"></div>
        </div>

        <!-- Science Guide Button -->
        <button id="btn-guide-toggle" style="
          pointer-events:auto; background:rgba(255,140,40,0.88); border:1px solid #ffd080;
          color:#fff; font-size:0.75rem; font-weight:900; letter-spacing:0.12em;
          padding:8px 16px; border-radius:6px; cursor:pointer; box-shadow:0 0 15px rgba(255,140,40,0.5);
          transition: transform 0.15s ease;
        ">
          📖 [H] MARS SCIENCE GUIDE
        </button>
      </div>

      <!-- Center Top: Real-Time Notification Banner -->
      <div id="hud-alert-banner" style="
        position:absolute; top:12%; left:50%; transform:translateX(-50%);
        background:rgba(12, 28, 48, 0.95); border:1px solid #00ff88; color:#fff;
        font-size:1.0rem; font-weight:800; letter-spacing:0.12em; padding:12px 30px;
        border-radius:8px; box-shadow:0 8px 30px rgba(0,0,0,0.8); display:none;
        text-align:center; max-width:85vw;
      "></div>

      <!-- Bottom Center: Hotbar -->
      <div style="position:absolute; bottom:28px; left:50%; transform:translateX(-50%); pointer-events:auto; display:flex; flex-direction:column; align-items:center;">
        <div style="font-size:0.68rem; font-weight:800; letter-spacing:0.2em; color:rgba(255,255,255,0.6); margin-bottom:6px;">
          ASTRONAUT INVENTORY [KEYS 1-5 &bull; HELD IN 3D HAND]
        </div>
        <div id="hud-inventory-bar" style="display:flex; gap:10px;">
          <div class="inv-slot" id="slot-0" style="width:78px; height:64px; background:rgba(6,18,32,0.6); border:1px solid rgba(255,255,255,0.2); border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#64748b; font-size:0.65rem; font-weight:800;">
            [EMPTY]
          </div>
          <div class="inv-slot" id="slot-1" style="width:78px; height:64px; background:rgba(6,18,32,0.6); border:1px solid rgba(255,255,255,0.2); border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#64748b; font-size:0.65rem; font-weight:800;">
            [EMPTY]
          </div>
          <div class="inv-slot" id="slot-2" style="width:78px; height:64px; background:rgba(6,18,32,0.6); border:1px solid rgba(255,255,255,0.2); border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#64748b; font-size:0.65rem; font-weight:800;">
            [EMPTY]
          </div>
          <div class="inv-slot" id="slot-3" style="width:78px; height:64px; background:rgba(6,18,32,0.6); border:1px solid rgba(255,255,255,0.2); border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#64748b; font-size:0.65rem; font-weight:800;">
            [EMPTY]
          </div>
          <div class="inv-slot" id="slot-4" style="width:78px; height:64px; background:rgba(6,18,32,0.6); border:1px solid rgba(255,255,255,0.2); border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#64748b; font-size:0.65rem; font-weight:800;">
            [EMPTY]
          </div>
        </div>
      </div>

      <!-- Controls Guidance -->
      <div style="position:absolute; bottom:6px; left:50%; transform:translateX(-50%); color:rgba(255,255,255,0.45); font-size:0.68rem; letter-spacing:0.12em;">
        [WASD] MOVE &bull; [CLICK/DRAG] LOOK &bull; [E] USE HANDS &bull; [SHIFT] SPRINT &bull; [SPACE] JUMP &bull; [1-5] HOLD ITEM &bull; [F] FLASHLIGHT &bull; [H] SCIENCE GUIDE &bull; [ESC] MENU
      </div>
    `;

    this.container.appendChild(hud);
    this.hudLayer = hud;
  }

  buildEducationalFieldGuide() {
    const modal = document.createElement('div');
    modal.id = 'mars-educational-modal';
    modal.style.cssText = `
      position: absolute; inset: 0; background: rgba(3, 8, 16, 0.94);
      z-index: 100; display: none; flex-direction: column; align-items: center; justify-content: center;
      padding: 40px; box-sizing: border-box; backdrop-filter: blur(10px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
      color: #fff;
    `;

    modal.innerHTML = `
      <div style="max-width:880px; width:100%; max-height:85vh; overflow-y:auto; background:rgba(10, 24, 42, 0.95); border:2px solid #ff9933; border-radius:12px; padding:30px; box-shadow:0 0 40px rgba(255,140,40,0.4);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:12px; margin-bottom:20px;">
          <div>
            <div style="font-size:0.75rem; font-weight:900; letter-spacing:0.2em; color:#ff9933;">BELIEVERS EXPEDITION SCIENTIFIC BRIEFING</div>
            <div style="font-size:1.4rem; font-weight:900; color:#fff;">PLANET MARS &bull; CHRYSE PLANITIA EXPLORATION GUIDE</div>
          </div>
          <button id="btn-close-guide" style="background:#ef4444; border:none; color:#fff; font-weight:900; padding:8px 18px; border-radius:6px; cursor:pointer;">CLOSE [H]</button>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px;">
          <!-- Card 1 -->
          <div style="background:rgba(6,18,32,0.85); border:1px solid #00e5ff; border-radius:8px; padding:16px;">
            <div style="color:#00e5ff; font-weight:900; font-size:0.95rem; margin-bottom:6px;">1. ATMOSPHERE & THE ARMSTRONG LIMIT</div>
            <div style="font-size:0.8rem; color:#cceeff; line-height:1.5;">
              Surface pressure is only <strong>610 Pa (0.006 atm)</strong>—less than 1% of Earth! Atmosphere is 95.3% CO₂, 2.6% N₂, 1.9% Ar. At this pressure, water boils below body temperature (37°C), making pressurized EVA suits mandatory for survival.
            </div>
          </div>

          <!-- Card 2 -->
          <div style="background:rgba(6,18,32,0.85); border:1px solid #00ff88; border-radius:8px; padding:16px;">
            <div style="color:#00ff88; font-weight:900; font-size:0.95rem; margin-bottom:6px;">2. SURFACE GRAVITY: 0.38g (3.72 m/s²)</div>
            <div style="font-size:0.8rem; color:#ccffdd; line-height:1.5;">
              Mars has only 10.7% of Earth's mass. You weigh <strong>62% less</strong> on Mars! This allows astronauts to carry heavy life support equipment and leap across boulders with ease.
            </div>
          </div>

          <!-- Card 3 -->
          <div style="background:rgba(6,18,32,0.85); border:1px solid #f97316; border-radius:8px; padding:16px;">
            <div style="color:#f97316; font-weight:900; font-size:0.95rem; margin-bottom:6px;">3. WHY MARS IS RED (HEMATITE & PERCHLORATES)</div>
            <div style="font-size:0.8rem; color:#ffeedd; line-height:1.5;">
              The red color is caused by <strong>iron(III) oxide (Fe₂O₃, rust)</strong> dust. The soil also contains toxic <strong>perchlorates (ClO₄⁻)</strong>, which must be chemically neutralized before astronauts can cultivate crops.
            </div>
          </div>

          <!-- Card 4 -->
          <div style="background:rgba(6,18,32,0.85); border:1px solid #38bdf8; border-radius:8px; padding:16px;">
            <div style="color:#38bdf8; font-weight:900; font-size:0.95rem; margin-bottom:6px;">4. SUBSURFACE ICE & ISRU FUEL PRODUCTION</div>
            <div style="font-size:0.8rem; color:#e0f2fe; line-height:1.5;">
              Glacial water ice exists centimeters beneath the dunes. Through <strong>ISRU (In-Situ Resource Utilization)</strong> and the Sabatier reaction, ice is split into liquid hydrogen and oxygen to manufacture return rocket fuel on Mars!
            </div>
          </div>

          <!-- Card 5 -->
          <div style="background:rgba(6,18,32,0.85); border:1px solid #eab308; border-radius:8px; padding:16px;">
            <div style="color:#eab308; font-weight:900; font-size:0.95rem; margin-bottom:6px;">5. CHRYSE PLANITIA OUTFLOW MEGA-FLOODS</div>
            <div style="font-size:0.8rem; color:#fef9c3; line-height:1.5;">
              Chryse Planitia ("Golden Plain") is an ancient lowland basin. 3.5 billion years ago, catastrophic flooding from Valles Marineris carved monumental teardrop-shaped islands and channels into this bedrock.
            </div>
          </div>

          <!-- Card 6 -->
          <div style="background:rgba(6,18,32,0.85); border:1px solid #ec4899; border-radius:8px; padding:16px;">
            <div style="color:#ec4899; font-weight:900; font-size:0.95rem; margin-bottom:6px;">6. DUST DEVILS & ELECTROSTATICS</div>
            <div style="font-size:0.8rem; color:#fce7f3; line-height:1.5;">
              Solar heating drives thermal vortexes that reach up to <strong>8 km high</strong>. Friction between dust grains generates electrostatic fields, cleaning solar panels but coating helmet visors.
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(modal);
    this.educationalModal = modal;

    const btnToggle = document.getElementById('btn-guide-toggle');
    if (btnToggle) btnToggle.onclick = () => this.toggleEducationalGuide();

    const btnClose = document.getElementById('btn-close-guide');
    if (btnClose) btnClose.onclick = () => this.toggleEducationalGuide();
  }

  toggleEducationalGuide() {
    this.guideOpen = !this.guideOpen;
    if (this.educationalModal) {
      this.educationalModal.style.display = this.guideOpen ? 'flex' : 'none';
    }
    this.playTone(880, 0.08, 'triangle', 0.1);
  }

  /* ================================================================
     8. CONTROLS: POINTER LOCK + MOUSE DRAG
     ================================================================ */
  setupControls() {
    const el = this.renderer.domElement;

    el.addEventListener('click', () => {
      if (!this.isLocked && el.requestPointerLock && !this.guideOpen) {
        el.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = (document.pointerLockElement === el);
    });

    el.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.active || this.guideOpen) return;
      if (this.isLocked) {
        const sens = 0.0022;
        this.yaw -= e.movementX * sens;
        this.pitch -= e.movementY * sens;
        this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch));
      } else if (this.isMouseDown) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        const sens = 0.003;
        this.yaw -= dx * sens;
        this.pitch -= dy * sens;
        this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch));
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      this.keys[e.code] = true;

      if (e.code === 'KeyH') {
        this.toggleEducationalGuide();
      }

      if (e.code === 'KeyE' && !this.guideOpen) {
        this.reachAnim = 1.0;
        this.triggerInteraction();
      }

      if (e.code === 'KeyF' && !this.guideOpen) {
        this.toggleFlashlight();
      }

      if (e.code === 'Space' && this.isGrounded && !this.guideOpen) {
        this.velocity.y = 4.4; // 0.38g jump!
        this.isGrounded = false;
        this.playTone(180, 0.15, 'sine', 0.08);
      }

      if (e.code.startsWith('Digit') && !this.guideOpen) {
        const num = parseInt(e.code.replace('Digit', '')) - 1;
        if (num >= 0 && num < 5) {
          this.selectedItemIndex = num;
          this.updateInventoryUI();
          this.updateHeldItemMesh();
          this.playTone(520, 0.08, 'triangle', 0.08);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.active) return;
      this.keys[e.code] = false;
    });
  }

  /* ================================================================
     9. GAMEPLAY INTERACTIONS & EDUCATIONAL MISSIONS
     ================================================================ */
  triggerInteraction() {
    if (!this.currentLookTarget) return;
    this.currentLookTarget.onInteract();
  }

  collectItem(id, displayName) {
    this.inventory.push({ id, name: displayName });
    this.playTone(660, 0.12, 'triangle', 0.12);
    setTimeout(() => this.playTone(880, 0.2, 'sine', 0.15), 100);

    const idx = this.interactables.findIndex(i => i.id === id);
    if (idx !== -1) {
      const it = this.interactables[idx];
      if (it.mesh && it.mesh.parent) it.mesh.parent.remove(it.mesh);
      this.interactables.splice(idx, 1);
    }

    this.selectedItemIndex = this.inventory.length - 1;
    this.updateInventoryUI();
    this.updateHeldItemMesh();
    this.showAlert(`✓ ACQUIRED: ${displayName} (HELD IN HAND)`);

    const hasCore = this.inventory.some(i => i.id === 'rover_core');
    const hasScanner = this.inventory.some(i => i.id === 'eva_scanner');
    const hasFlag = this.inventory.some(i => i.id === 'mission_flag');

    if (this.missionStep === 1 && (hasCore || hasScanner || hasFlag)) {
      this.setMission(2, 'STEP OUT ONTO MARS', 'Walk down the lowered hydraulic ramp onto the Martian regolith.');
    }
  }

  solveRoverReboot() {
    const hasCore = this.inventory.some(i => i.id === 'rover_core');
    if (!hasCore) {
      this.showAlert('❌ MISSING PART: Find the Rover Power Core inside the spaceship cargo crates!');
      this.playTone(140, 0.25, 'sawtooth', 0.12);
      return;
    }

    this.inventory = this.inventory.filter(i => i.id !== 'rover_core');
    this.updateInventoryUI();
    this.updateHeldItemMesh();
    this.roverFixed = true;

    if (this.roverLight) this.roverLight.intensity = 2.8;
    this.playTone(440, 0.2, 'triangle', 0.15);
    setTimeout(() => this.playTone(660, 0.2, 'sine', 0.18), 180);
    setTimeout(() => this.playTone(880, 0.4, 'sine', 0.2), 360);

    this.interactables = this.interactables.filter(i => i.id !== 'rover_target');

    this.showAlert(`
      <div style="color:#00ff88; font-weight:900;">⚡ ROVER ONLINE: SCIENCE TRANSMISSION RECEIVED!</div>
      <div style="font-size:0.85rem; color:#fff; margin-top:4px;">
        "Martian dust reduces solar efficiency by 0.28%/day. RTG nuclear isotope power is required for long missions."
      </div>
    `);

    // Update waypoint banner to North Beacon
    const pin = document.getElementById('hud-nav-pin');
    if (pin) pin.innerHTML = '▲ RECON PROBE BEACON: 65m NORTH (LOOK FOR CYAN SKY BEAM)';

    this.setMission(4, 'SALVAGE CRASHED PROBE (NORTH)', 'Look directly NORTH [N] for the glowing cyan sky beacon 65m away to retrieve the Black Box.');
  }

  solveCrashedProbe() {
    this.playTone(740, 0.15, 'sine', 0.15);
    this.inventory.push({ id: 'black_box', name: '💾 BLACK BOX' });
    this.selectedItemIndex = this.inventory.length - 1;
    this.updateInventoryUI();
    this.updateHeldItemMesh();

    if (this.probeBeacon) this.probeBeacon.color.setHex(0x00ff88);
    this.interactables = this.interactables.filter(i => i.id !== 'black_box');

    this.showAlert(`
      <div style="color:#00e5ff; font-weight:900;">💾 BLACK BOX EXTRACTED &bull; SCIENTIFIC DISCOVERY UNLOCKED!</div>
      <div style="font-size:0.85rem; color:#fff; margin-top:4px;">
        "Ground-penetrating radar confirms pure water ice 14cm below regolith! The Sabatier reaction can synthesize CH₄ + O₂ return rocket fuel!"
      </div>
    `);

    const pin = document.getElementById('hud-nav-pin');
    if (pin) pin.innerHTML = '▲ ALIEN MONOLITH: 55m SOUTH (PURPLE SKY BEAM)';

    this.setMission(5, 'DECODE ALIEN MONOLITH', 'Trek South into the impact crater and analyze the humming Alien Monolith with your EVA Scanner.');
  }

  solveMonolithScan() {
    const hasScanner = this.inventory.some(i => i.id === 'eva_scanner');
    if (!hasScanner) {
      this.showAlert('❌ TOOL REQUIRED: Find the EVA Geological Scanner inside the spaceship on the workbench!');
      this.playTone(140, 0.25, 'sawtooth', 0.12);
      return;
    }

    this.playTone(440, 0.6, 'sawtooth', 0.12);
    this.playTone(880, 0.8, 'sine', 0.15);

    if (this.monolithLight) this.monolithLight.color.setHex(0xff00ff);
    this.interactables = this.interactables.filter(i => i.id !== 'monolith');

    this.showAlert(`
      <div style="color:#d946ef; font-weight:900;">🔮 MONOLITH DECODED &bull; PLANETARY SCIENCE LOG UNLOCKED!</div>
      <div style="font-size:0.85rem; color:#fff; margin-top:4px;">
        "Mars magnetic dynamo shut down 4 billion years ago. Solar winds stripped the atmosphere. Human habitats must be shielded by 2m of Martian regolith."
      </div>
    `);

    const pin = document.getElementById('hud-nav-pin');
    if (pin) pin.innerHTML = '▲ CHRYSE SUMMIT: 70m NORTH-EAST (RED SKY BEAM)';

    this.setMission(6, 'CLAIM MARS: PLANT FLAG', 'Climb to the summit of Chryse Ridge and plant the Believers Mission Flag [E].');
  }

  solvePlantFlag() {
    const hasFlag = this.inventory.some(i => i.id === 'mission_flag');
    if (!hasFlag) {
      this.showAlert('❌ MISSING FLAG: Retrieve the Believers Mission Flag from the spaceship locker!');
      return;
    }

    this.inventory = this.inventory.filter(i => i.id !== 'mission_flag');
    this.updateInventoryUI();
    this.updateHeldItemMesh();

    const summitY = this.getMarsSoilElevation(-35, -55);
    const flagGroup = new THREE.Group();
    flagGroup.position.set(-35, summitY + 0.8, -55);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 4.5),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.9 })
    );
    pole.position.y = 2.25;
    flagGroup.add(pole);

    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.4, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
    );
    banner.position.set(1.2, 3.6, 0);
    flagGroup.add(banner);

    this.scene.add(flagGroup);

    this.playVictoryFanfare();
    this.interactables = this.interactables.filter(i => i.id !== 'summit_flag');

    this.showAlert(`
      <div style="color:#facc15; font-size:1.35rem; font-weight:900; letter-spacing:0.2em; margin-bottom:6px;">
        🏆 MISSION COMPLETE &bull; CERTIFIED PLANETARY SCIENTIST!
      </div>
      <div style="color:#fff; font-size:0.95rem;">
        BELIEVERS STUDIOS MISSION FLAG FIRMLY ANCHORED ON MARS! PRESS [H] FOR SCIENTIFIC LOGS.
      </div>
    `);

    const pin = document.getElementById('hud-nav-pin');
    if (pin) pin.innerHTML = '✓ CHRYSE BASE ALPHA ESTABLISHED &bull; ALL MISSIONS COMPLETE';

    const titleEl = document.getElementById('hud-mission-title');
    if (titleEl) titleEl.innerHTML = '<span style="color:#00ff88;">🏆 ALL EXPEDITION MISSIONS ACCOMPLISHED!</span>';
    const descEl = document.getElementById('hud-mission-desc');
    if (descEl) descEl.innerHTML = 'You have mastered Mars surface navigation, solved all scientific objectives, and unlocked full knowledge of the Red Planet. Press [H] to review.';
  }

  setMission(stepNum, title, desc) {
    this.missionStep = stepNum;
    const sEl = document.getElementById('hud-step-num');
    if (sEl) sEl.textContent = stepNum;
    const tEl = document.getElementById('hud-mission-title');
    if (tEl) tEl.textContent = title;
    const dEl = document.getElementById('hud-mission-desc');
    if (dEl) dEl.textContent = desc;
  }

  showAlert(html) {
    const banner = document.getElementById('hud-alert-banner');
    if (!banner) return;
    banner.innerHTML = html;
    banner.style.display = 'block';
    setTimeout(() => { banner.style.display = 'none'; }, 5500);
  }

  updateInventoryUI() {
    for (let i = 0; i < 5; i++) {
      const slot = document.getElementById(`slot-${i}`);
      if (!slot) continue;
      const item = this.inventory[i];
      if (item) {
        slot.style.border = (i === this.selectedItemIndex) ? '2px solid #00ff88' : '1px solid #00e5ff';
        slot.style.color = '#fff';
        slot.style.background = (i === this.selectedItemIndex) ? 'rgba(0,255,136,0.25)' : 'rgba(6,18,32,0.85)';
        slot.innerHTML = item.name;
      } else {
        slot.style.border = '1px solid rgba(255,255,255,0.15)';
        slot.style.color = '#64748b';
        slot.style.background = 'rgba(6,18,32,0.5)';
        slot.innerHTML = '[EMPTY]';
      }
    }
  }

  toggleFlashlight() {
    this.flashlightOn = !this.flashlightOn;
    if (this.spotlight3D) this.spotlight3D.visible = this.flashlightOn;
    this.playTone(880, 0.06, 'triangle', 0.1);

    const txt = document.getElementById('hud-light-txt');
    if (txt) {
      txt.textContent = this.flashlightOn ? '[F] ON' : '[F] OFF';
      txt.style.color = this.flashlightOn ? '#00ff88' : '#888';
    }
  }

  /* ================================================================
     10. WEB AUDIO SYNTHESIS
     ================================================================ */
  initAudio() {
    try {
      if (!this.audioCtx) {
        const C = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new C();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      this.startWindAudio();
    } catch(e) {}
  }

  playTone(freq, dur, type = 'sine', vol = 0.1) {
    try {
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch(e) {}
  }

  startWindAudio() {
    try {
      const ctx = this.audioCtx;
      if (!ctx) return;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < buf.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.setValueAtTime(220, ctx.currentTime);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.07, ctx.currentTime);
      src.connect(filt); filt.connect(g); g.connect(ctx.destination);
      src.start();
      this.windSource = src;
    } catch(e) {}
  }

  playFootstep(isMetal) {
    if (isMetal) {
      this.playTone(110, 0.14, 'sawtooth', 0.12);
      this.playTone(280, 0.08, 'square', 0.06);
    } else {
      this.playTone(65, 0.16, 'sine', 0.15);
      this.playTone(320, 0.06, 'triangle', 0.08);
    }
  }

  playVictoryFanfare() {
    const notes = [440, 554, 659, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.35, 'triangle', 0.2), i * 160);
    });
    setTimeout(() => this.playTone(880, 1.2, 'sine', 0.3), 700);
  }

  /* ================================================================
     11. MAIN REAL-TIME LOOP WITH SOLID COLLISION & RADAR TRACKING
     ================================================================ */
  start() {
    this.active = true;
    this.container.style.display = 'block';
    this.initAudio();

    let lastT = performance.now();

    const loop = (now) => {
      if (!this.active) return;
      const dt = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;

      // 1. Camera orientation
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;

      // 2. Movement Vector
      const isSprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
      const speed = isSprint ? this.sprintSpeed : this.moveSpeed;
      let moveX = 0, moveZ = 0;

      if (!this.guideOpen) {
        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;
      }

      const len = Math.hypot(moveX, moveZ);
      if (len > 0) {
        moveX /= len;
        moveZ /= len;
      }

      const forwardX = -Math.sin(this.yaw);
      const forwardZ = -Math.cos(this.yaw);
      const rightX = Math.cos(this.yaw);
      const rightZ = -Math.sin(this.yaw);

      const targetVx = (forwardX * -moveZ + rightX * moveX) * speed;
      const targetVz = (forwardZ * -moveZ + rightZ * moveX) * speed;

      this.velocity.x += (targetVx - this.velocity.x) * 10 * dt;
      this.velocity.z += (targetVz - this.velocity.z) * 10 * dt;

      // Apply horizontal position
      this.playerPos.x += this.velocity.x * dt;
      this.playerPos.z += this.velocity.z * dt;

      // 3. SOLID OBSTACLE & WALL COLLISION PHYSICS (NO GOING THROUGH WALLS/STONES)
      this.resolveCollisions(0.48);

      // 4. EXACT TERRAIN HEIGHTMAP COLLISION & GRAVITY PHYSICS
      const floorHeight = this.getTerrainHeight(this.playerPos.x, this.playerPos.z);
      const eyeHeight = 1.7;

      this.velocity.y -= this.gravity * dt;
      this.playerPos.y += this.velocity.y * dt;

      if (this.playerPos.y <= floorHeight + eyeHeight) {
        this.playerPos.y = floorHeight + eyeHeight;
        this.velocity.y = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }

      // Live elevation HUD update
      const elevEl = document.getElementById('hud-elev-txt');
      if (elevEl) elevEl.textContent = `${floorHeight >= 0 ? '+' : ''}${floorHeight.toFixed(1)}m`;

      // 5. Locomotion Head-bobbing & Footstep Audio
      let bob = 0;
      const isMovingHoriz = Math.hypot(this.velocity.x, this.velocity.z) > 0.8;
      const isInsideShip = (this.playerPos.z > -4 && Math.abs(this.playerPos.x) < 5.8);
      const isOnRamp = (this.playerPos.z <= -4 && this.playerPos.z >= -14.0 && Math.abs(this.playerPos.x) < 2.5);

      if (isMovingHoriz && this.isGrounded) {
        this.stepTimer += dt * (isSprint ? 14 : 9);
        bob = Math.sin(this.stepTimer) * (isSprint ? 0.08 : 0.04);

        if (Math.sin(this.stepTimer) > 0.96) {
          this.playFootstep(isInsideShip || isOnRamp);
        }
      }

      this.camera.position.set(this.playerPos.x, this.playerPos.y + bob, this.playerPos.z);

      // 6. 3D Astronaut Arm Sway & Reach Animation
      if (this.leftArm && this.rightArm) {
        const breath = Math.sin(now * 0.002) * 0.008;
        const walkSwing = isMovingHoriz ? Math.sin(this.stepTimer) * 0.05 : 0;

        this.leftArm.armGroup.position.z = walkSwing;
        this.leftArm.armGroup.position.y = -0.10 + breath - (isMovingHoriz ? Math.abs(walkSwing) * 0.2 : 0);
        this.leftArm.armGroup.rotation.x = 0.22 + (isMovingHoriz ? walkSwing * 1.5 : 0);

        if (this.reachAnim > 0) {
          this.reachAnim = Math.max(0, this.reachAnim - dt * 4.5);
        }
        const reachOffsetZ = -this.reachAnim * 0.25;
        const reachRotX = this.reachAnim * 0.35;

        this.rightArm.armGroup.position.z = -walkSwing + reachOffsetZ;
        this.rightArm.armGroup.position.y = -0.10 + breath + (this.reachAnim * 0.08);
        this.rightArm.armGroup.rotation.x = 0.22 - (isMovingHoriz ? walkSwing * 1.5 : 0) + reachRotX;
      }

      // Check Mission 2 completion: Stepped onto Mars!
      if (this.missionStep === 2 && !isInsideShip && !isOnRamp && this.playerPos.z < -14.0) {
        this.setMission(3, 'REBOOT THE MARS ROVER', 'Locate the stranded exploration rover near the ship and insert the Rover Power Core [E].');
        this.showAlert('👣 FIRST STEPS ON MARS: Humanity has set foot in Chryse Planitia! Press [H] for Science Guide.');
      }

      // 7. UPDATE RADAR BLIPS (Showing North and Probe relative position)
      const radarProbe = document.getElementById('radar-blip-probe');
      if (radarProbe) {
        // Probe is at (-28, -65)
        const relX = -28 - this.playerPos.x;
        const relZ = -65 - this.playerPos.z;
        const radarScale = 0.65; // map scale
        const blipX = 65 + relX * radarScale;
        const blipY = 65 + relZ * radarScale;
        radarProbe.style.left = `${Math.max(10, Math.min(120, blipX))}px`;
        radarProbe.style.top = `${Math.max(10, Math.min(120, blipY))}px`;
      }

      // 8. Animate Rover Dish
      if (this.roverFixed && this.roverDish) {
        this.roverDish.rotation.y += 0.8 * dt;
      }

      // 9. Raycast Interaction Target
      this.checkLookTarget();

      // 10. Pulse beacons
      if (this.probeBeacon) {
        this.probeBeacon.intensity = 2.0 + Math.sin(now * 0.008) * 1.5;
      }

      // 11. Drifting dust particles
      if (this.particles) {
        const pArr = this.particles.geometry.attributes.position.array;
        for (let i = 0; i < pArr.length; i += 3) {
          pArr[i] += 4.5 * dt;
          if (pArr[i] > 70) pArr[i] = -70;
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
      }

      // 12. Render Three.js Scene
      this.renderer.render(this.scene, this.camera);

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  checkLookTarget() {
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    let closest = null;
    let closestDist = Infinity;

    for (const item of this.interactables) {
      if (!item.mesh) continue;
      const targetPos = item.mesh.position || (item.mesh.getWorldPosition ? item.mesh.getWorldPosition(new THREE.Vector3()) : null);
      if (!targetPos) continue;

      const toTarget = new THREE.Vector3().subVectors(targetPos, this.camera.position);
      const dist = toTarget.length();

      if (dist < (item.radius || 3.0)) {
        toTarget.normalize();
        const dot = camDir.dot(toTarget);
        if (dot > 0.86 && dist < closestDist) {
          closest = item;
          closestDist = dist;
        }
      }
    }

    const promptEl = document.getElementById('hud-prompt');
    const reticleEl = document.getElementById('hud-reticle');

    if (closest) {
      this.currentLookTarget = closest;
      if (promptEl) {
        promptEl.style.display = 'block';
        promptEl.innerHTML = `[E] ${closest.action}`;
      }
      if (reticleEl) {
        reticleEl.style.transform = 'translate(-50%, -50%) scale(1.6)';
        reticleEl.style.borderColor = '#00ff88';
      }
    } else {
      this.currentLookTarget = null;
      if (promptEl) promptEl.style.display = 'none';
      if (reticleEl) {
        reticleEl.style.transform = 'translate(-50%, -50%) scale(1.0)';
        reticleEl.style.borderColor = 'rgba(255, 255, 255, 0.7)';
      }
    }
  }

  stop() {
    this.active = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.container.style.display = 'none';

    if (document.exitPointerLock) document.exitPointerLock();

    const dash = document.getElementById('dashboard-screen');
    if (dash) dash.style.opacity = '1';
  }
}

// Global Singleton
window.starshipGame = new BelieversMars3DGame();
