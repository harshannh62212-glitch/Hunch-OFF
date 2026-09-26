// NASA HUNCH 2026–2027 // LLASO Project 2
// AEGIS-V1 External Cargo Transport System (ECTS)
// Engineering CAD Viewer & Mission Simulation Engine

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // --- 1. THREE.JS CAD INSPECTION VIEWER ---
  const canvas = document.getElementById('rover-canvas');
  if (canvas && window.THREE) {
    initCADViewer(canvas);
  }

  function initCADViewer(canvasEl) {
    const container = canvasEl.parentElement;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d101a);
    scene.fog = new THREE.FogExp2(0x0d101a, 0.025);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(10, 6.5, 11);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasEl,
      antialias: true,
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Controls
    const controls = new THREE.OrbitControls(camera, canvasEl);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.minDistance = 4;
    controls.maxDistance = 28;
    controls.target.set(0, 1.2, 0);

    // Balanced Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(12, 20, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
    fillLight.position.set(-12, 10, -10);
    scene.add(fillLight);

    // Studio Inspection Floor Plate
    const floorGeo = new THREE.CylinderGeometry(14, 14, 0.2, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x141824,
      roughness: 0.85,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle CAD Alignment Grid
    const grid = new THREE.GridHelper(26, 26, 0x334155, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    // Assembly Root & Sub-Assemblies
    const assembly = new THREE.Group();
    scene.add(assembly);

    const chassisGroup = new THREE.Group();     // Lower PETG tub + Internal Avionics (GOLDENMATE, Pi5, Uno R3, Buck, 6x 3007 fans)
    const suspensionGroup = new THREE.Group();  // 6x Greartisan 100RPM 37mm Gear Motors + Rocker-Bogie + Deep-Chevron Tires
    const cargoGroup = new THREE.Group();       // Upper Stealth-Black PETG Armored Shell (Elevates in Exploded View)
    const mastGroup = new THREE.Group();        // YDLIDAR X2L 360° Turret + Dual Arducam 5MP OV5647 Cameras
    const dockStationGroup = new THREE.Group(); // HQST 100W 9BB Solar Garage Docking Bay (positioned behind rover)
    dockStationGroup.position.set(-7.2, 0, 0);

    assembly.add(chassisGroup);
    assembly.add(suspensionGroup);
    assembly.add(cargoGroup);
    assembly.add(mastGroup);
    scene.add(dockStationGroup);

    // --- PROCEDURAL HIGH-DEFINITION TEXTURE GENERATORS ---
    function createPetgTex(withDust) {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
      const c = cv.getContext('2d');
      c.fillStyle = '#101216'; c.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y += 3) {
        const s = 14 + Math.sin(y * 1.7) * 4 + (Math.random() - 0.5) * 5;
        c.fillStyle = `rgb(${Math.round(s)},${Math.round(s+1)},${Math.round(s+4)})`;
        c.fillRect(0, y, 512, 1.6);
      }
      c.strokeStyle = 'rgba(255,255,255,0.03)'; c.lineWidth = 1.2;
      for (let d = -512; d < 1024; d += 6) {
        c.beginPath(); c.moveTo(d, 0); c.lineTo(d + 512, 512); c.stroke();
      }
      if (withDust) {
        const id = c.getImageData(0, 0, 512, 512), dat = id.data;
        for (let i = 0; i < dat.length; i += 4) {
          const py = Math.floor((i / 4) / 512);
          const dust = Math.max(0, (py - 320) / 192) * 26;
          dat[i] = Math.min(255, dat[i] + dust);
          dat[i+1] = Math.min(255, dat[i+1] + dust);
          dat[i+2] = Math.min(255, dat[i+2] + dust * 1.05);
        }
        c.putImageData(id, 0, 0);
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 3);
      return tex;
    }

    function createHqstSolarTex() {
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024;
      const c = cv.getContext('2d');
      c.fillStyle = '#cbd5e1'; c.fillRect(0, 0, 1024, 1024);
      const cols = 6, rows = 6, pad = 18, gap = 8;
      const cellW = (1024 - pad * 2 - gap * (cols - 1)) / cols;
      const cellH = (1024 - pad * 2 - gap * (rows - 1)) / rows;
      const bev = 11;
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const x = pad + col * (cellW + gap), y = pad + r * (cellH + gap);
          const cg = c.createLinearGradient(x, y, x + cellW, y + cellH);
          cg.addColorStop(0, '#061128'); cg.addColorStop(0.5, '#0b2149'); cg.addColorStop(1, '#040c1f');
          c.fillStyle = cg;
          c.beginPath();
          c.moveTo(x + bev, y); c.lineTo(x + cellW - bev, y); c.lineTo(x + cellW, y + bev);
          c.lineTo(x + cellW, y + cellH - bev); c.lineTo(x + cellW - bev, y + cellH);
          c.lineTo(x + bev, y + cellH); c.lineTo(x, y + cellH - bev); c.lineTo(x, y + bev);
          c.closePath(); c.fill();
          c.strokeStyle = 'rgba(148,195,245,0.22)'; c.lineWidth = 0.8;
          for (let fy = y + 4; fy < y + cellH - 4; fy += 4.5) {
            c.beginPath(); c.moveTo(x + 3, fy); c.lineTo(x + cellW - 3, fy); c.stroke();
          }
          // 9BB (9 Silver Busbars per Monocrystalline Cell)
          c.strokeStyle = 'rgba(226,232,240,0.85)'; c.lineWidth = 1.5;
          for (let bb = 1; bb <= 9; bb++) {
            const bx = x + (cellW / 10) * bb;
            c.beginPath(); c.moveTo(bx, y + 2); c.lineTo(bx, y + cellH - 2); c.stroke();
          }
        }
      }
      c.strokeStyle = '#94a3b8'; c.lineWidth = 22; c.strokeRect(11, 11, 1002, 1002);
      c.fillStyle = 'rgba(15,23,42,0.9)'; c.fillRect(36, 966, 410, 36);
      c.fillStyle = '#38bdf8'; c.font = 'bold 18px monospace';
      c.fillText('HQST 100W 12V • 9BB MONO • 23% EFF • IP65', 48, 990);
      return new THREE.CanvasTexture(cv);
    }

    function createGoldenmateTex() {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
      const c = cv.getContext('2d');
      c.fillStyle = '#14171c'; c.fillRect(0, 0, 512, 256);
      const bg = c.createLinearGradient(0, 0, 512, 0);
      bg.addColorStop(0, '#059669'); bg.addColorStop(0.65, '#10b981'); bg.addColorStop(1, '#f59e0b');
      c.fillStyle = bg; c.fillRect(16, 18, 480, 44);
      c.fillStyle = '#ffffff'; c.font = '900 28px sans-serif'; c.fillText('GOLDENMATE', 28, 50);
      c.fillStyle = '#062e22'; c.font = 'bold 16px monospace'; c.fillText('IP67 WATERPROOF', 335, 46);
      c.fillStyle = '#1e242d'; c.fillRect(16, 68, 480, 168);
      c.fillStyle = '#34d399'; c.font = '900 34px monospace'; c.fillText('12V 10Ah', 30, 114);
      c.fillStyle = '#f8fafc'; c.font = 'bold 19px monospace'; c.fillText('LiFePO4 LITHIUM IRON PHOSPHATE', 30, 144);
      c.fillStyle = '#fbbf24'; c.font = 'bold 16px monospace'; c.fillText('128Wh • 5000+ DEEP CYCLES • BUILT-IN BMS', 30, 174);
      return new THREE.CanvasTexture(cv);
    }

    function createArduinoTex() {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 384;
      const c = cv.getContext('2d');
      c.fillStyle = '#00797c'; c.fillRect(0, 0, 512, 384);
      c.strokeStyle = '#f8fafc'; c.lineWidth = 3; c.strokeRect(10, 10, 492, 364);
      c.fillStyle = '#ffffff'; c.font = 'bold 14px monospace';
      c.fillText('AREF GND 13 12 ~11 ~10 ~9  8   DIGITAL (PWM~)   7  6 ~5  4 ~3  2 TX1 RX0', 38, 34);
      c.fillText('IOREF RESET 3.3V 5V GND GND VIN        POWER       A0 A1 A2 A3 A4 A5 ANALOG', 38, 360);
      c.font = '900 32px sans-serif'; c.fillText('ARDUINO UNO R3', 120, 130);
      c.fillStyle = '#e2e8f0'; c.font = 'bold 14px monospace'; c.fillText('ATmega328P • 16MHz • A000066', 120, 160);
      return new THREE.CanvasTexture(cv);
    }

    function createPi5Tex() {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 340;
      const c = cv.getContext('2d');
      c.fillStyle = '#14532d'; c.fillRect(0, 0, 512, 340);
      for (let p = 0; p < 20; p++) {
        c.fillStyle = '#fbbf24';
        c.fillRect(65 + p * 18, 14, 10, 10);
        c.fillRect(65 + p * 18, 28, 10, 10);
      }
      c.fillStyle = '#ffffff'; c.font = 'bold 18px monospace';
      c.fillText('Raspberry Pi 5 Model B • 4GB RAM', 75, 72);
      c.fillStyle = '#bbf7d0'; c.font = '14px monospace';
      c.fillText('SANOOV ACTIVE COOLER • DUAL OV5647 CSI', 75, 98);
      return new THREE.CanvasTexture(cv);
    }

    function createHazardTex() {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
      const c = cv.getContext('2d');
      c.fillStyle = '#eab308'; c.fillRect(0, 0, 256, 64);
      c.fillStyle = '#090d16';
      for (let x = -64; x < 320; x += 32) {
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 16, 0); c.lineTo(x + 48, 64); c.lineTo(x + 32, 64); c.closePath(); c.fill();
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 1);
      return tex;
    }

    const petgTex = createPetgTex(true);
    const petgCleanTex = createPetgTex(false);
    const hqstSolarTex = createHqstSolarTex();
    const goldenmateTex = createGoldenmateTex();
    const arduinoTex = createArduinoTex();
    const pi5Tex = createPi5Tex();
    const hazardTex = createHazardTex();

    // Realistic Engineering Materials
    const materials = {
      petgChassis: new THREE.MeshStandardMaterial({ map: petgTex, bumpMap: petgTex, bumpScale: 0.03, color: 0x1a1d24, roughness: 0.52, metalness: 0.28 }),
      petgArmor: new THREE.MeshStandardMaterial({ map: petgCleanTex, bumpMap: petgCleanTex, bumpScale: 0.02, color: 0x12151c, roughness: 0.42, metalness: 0.32 }),
      brassInsert: new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.22, metalness: 0.94 }),
      titaniumBumper: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.24, metalness: 0.88 }),
      darkAnodized: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.82 }),
      blueAnodized: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.85 }),
      treadWheel: new THREE.MeshStandardMaterial({ map: petgTex, bumpMap: petgTex, bumpScale: 0.08, color: 0x323640, roughness: 0.78, metalness: 0.3 }),
      hqstSolar: new THREE.MeshStandardMaterial({ map: hqstSolarTex, roughness: 0.18, metalness: 0.65 }),
      goldenmateBat: new THREE.MeshStandardMaterial({ map: goldenmateTex, roughness: 0.38, metalness: 0.2 }),
      arduinoPcb: new THREE.MeshStandardMaterial({ map: arduinoTex, roughness: 0.35, metalness: 0.25 }),
      pi5Pcb: new THREE.MeshStandardMaterial({ map: pi5Tex, roughness: 0.38, metalness: 0.28 }),
      arducamPcb: new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.45, metalness: 0.3 }),
      sensorOptics: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.08, metalness: 0.95 }),
      hazardMat: new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.4, metalness: 0.3 }),
      cyanGlow: new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.2 }),
      emeraldGlow: new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x16a34a, emissiveIntensity: 1.2 }),
      wireRed: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
    };

    const inspectableMeshes = [];
    const fanRotors = [];
    const regMesh = (m) => { inspectableMeshes.push(m); return m; };

    // --- 1. LOWER BLACK PETG CHASSIS TUB, BRASS INSERTS, 6x 3007 FANS & INTERNAL ELECTRONICS ---
    const lowerTub = regMesh(new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 2.65), materials.petgChassis));
    lowerTub.position.y = 1.05;
    lowerTub.castShadow = true; lowerTub.receiveShadow = true;
    chassisGroup.add(lowerTub);

    // Front & Rear Approach Bumpers
    const frontBumper = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 2.85), materials.titaniumBumper));
    frontBumper.position.set(2.34, 0.98, 0);
    const rearBumper = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 2.75), materials.titaniumBumper));
    rearBumper.position.set(-2.32, 0.98, 0);
    chassisGroup.add(frontBumper, rearBumper);

    // 20x M3/M4 Brass Heat-Set Threaded Inserts around Lower Tub Perimeter
    for (let bx = -1.9; bx <= 1.95; bx += 0.76) {
      [-1.26, 1.26].forEach(bz => {
        const insert = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 12), materials.brassInsert));
        insert.position.set(bx, 1.42, bz);
        chassisGroup.add(insert);
      });
    }

    // 6x 30x30x7mm (3007) Brushless Cooling Fans (3 Left Intake, 3 Right Exhaust)
    [-1.34, 1.34].forEach(fz => {
      [-1.15, 0.0, 1.15].forEach(fx => {
        const fanHousing = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.08), materials.darkAnodized));
        fanHousing.position.set(fx, 1.06, fz);
        chassisGroup.add(fanHousing);

        const rotor = new THREE.Group();
        rotor.position.set(fx, 1.06, fz + (fz > 0 ? 0.03 : -0.03));
        const rHub = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12), materials.brassInsert));
        rHub.rotation.x = Math.PI / 2;
        rotor.add(rHub);
        for (let b = 0; b < 7; b++) {
          const blade = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.015), materials.titaniumBumper));
          const ang = (b / 7) * Math.PI * 2;
          blade.position.set(Math.cos(ang) * 0.11, Math.sin(ang) * 0.11, 0);
          blade.rotation.z = ang + 0.45;
          rotor.add(blade);
        }
        chassisGroup.add(rotor);
        fanRotors.push(rotor);
      });
    });

    // INTERNAL AVIONICS BAY (GOLDENMATE 12V 10Ah LiFePO4, Pi 5 4GB, Arduino Uno R3, YRDZXG 5A Buck Converter)
    const goldenmateBat = regMesh(new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.68, 0.82), materials.goldenmateBat));
    goldenmateBat.position.set(-0.88, 1.56, -0.32);
    goldenmateBat.castShadow = true;
    chassisGroup.add(goldenmateBat);

    const pi5Board = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.14, 0.58), materials.pi5Pcb));
    pi5Board.position.set(0.82, 1.46, -0.48);
    const pi5Cooler = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.42), materials.titaniumBumper));
    pi5Cooler.position.set(0.82, 1.58, -0.48);
    chassisGroup.add(pi5Board, pi5Cooler);

    const arduinoUno = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.12, 0.56), materials.arduinoPcb));
    arduinoUno.position.set(0.82, 1.45, 0.52);
    chassisGroup.add(arduinoUno);

    const buckConverter = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.42), materials.darkAnodized));
    buckConverter.position.set(-0.82, 1.48, 0.68);
    chassisGroup.add(buckConverter);

    // --- 2. 6-WHEEL ROCKER-BOGIE DRIVETRAIN & 6x GREARTISAN 12V 100RPM 37MM GEAR MOTORS ---
    const wheelPositions = [
      { x: 1.95, z: 1.68 },  { x: 0.0, z: 1.82 },  { x: -1.95, z: 1.68 },
      { x: 1.95, z: -1.68 }, { x: 0.0, z: -1.82 }, { x: -1.95, z: -1.68 }
    ];

    const wheelMeshes = [];
    wheelPositions.forEach(pos => {
      const wheelAssembly = new THREE.Group();
      wheelAssembly.position.set(pos.x, 0.56, pos.z);
      const zSign = pos.z > 0 ? 1 : -1;

      // Deep-Chevron TPU/PETG Tire
      const tireGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.44, 32);
      tireGeo.rotateX(Math.PI / 2);
      const tire = regMesh(new THREE.Mesh(tireGeo, materials.treadWheel));
      tire.castShadow = true; tire.receiveShadow = true;
      wheelAssembly.add(tire);
      wheelMeshes.push(tire);

      // 14 Angled 3D-Printed Grouser Lugs + 6 Brass Hub Lug Inserts
      for (let g = 0; g < 14; g++) {
        const lug = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.40), materials.petgArmor));
        const ang = (g / 14) * Math.PI * 2;
        lug.position.set(Math.cos(ang) * 0.55, Math.sin(ang) * 0.55, 0);
        lug.rotation.z = ang;
        tire.add(lug);
      }
      const hub = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.48, 16).rotateX(Math.PI / 2), materials.brassInsert));
      wheelAssembly.add(hub);

      // Greartisan DC 12V 100RPM 37mm Centric Gearbox (Silver) + Motor Can (Black)
      const gearbox37 = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.28, 20).rotateX(Math.PI / 2), materials.titaniumBumper));
      gearbox37.position.set(0, 0, -zSign * 0.34);
      const motorCan = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.32, 20).rotateX(Math.PI / 2), materials.darkAnodized));
      motorCan.position.set(0, 0, -zSign * 0.62);
      const clampPod = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.58, 0.18), materials.petgArmor));
      clampPod.position.set(0, 0.28, -zSign * 0.28);
      wheelAssembly.add(gearbox37, motorCan, clampPod);

      suspensionGroup.add(wheelAssembly);
    });

    // Articulated Black PETG Rocker-Bogie Arms & Differential Pivot
    [-1.42, 1.42].forEach(rz => {
      const rockerF = regMesh(new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.18, 0.16), materials.petgArmor));
      rockerF.position.set(0.95, 1.02, rz); rockerF.rotation.z = -0.08;
      const bogieR = regMesh(new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.18, 0.16), materials.petgArmor));
      bogieR.position.set(-0.95, 1.02, rz); bogieR.rotation.z = 0.08;
      const diffHub = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.28, 16).rotateX(Math.PI / 2), materials.brassInsert));
      diffHub.position.set(0, 1.12, rz);
      suspensionGroup.add(rockerF, bogieR, diffHub);
    });

    // --- 3. ENCLOSED STEALTH-BLACK PETG ARMORED UPPER SHELL (LIFTS IN EXPLODED VIEW) ---
    const upperArmor = regMesh(new THREE.Mesh(new THREE.BoxGeometry(4.32, 0.62, 2.56), materials.petgArmor));
    upperArmor.position.set(0, 1.68, 0);
    upperArmor.castShadow = true; upperArmor.receiveShadow = true;
    cargoGroup.add(upperArmor);

    const armorSpine = regMesh(new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.22, 1.75), materials.petgChassis));
    armorSpine.position.set(-0.1, 2.08, 0);
    cargoGroup.add(armorSpine);

    // Top Magnetic Charging Contact Pad (Mates with Solar Garage Overhead Pogo-Pin Arm)
    const chargeContactPad = regMesh(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.95), materials.brassInsert));
    chargeContactPad.position.set(-1.05, 2.21, 0);
    cargoGroup.add(chargeContactPad);

    // Cyan Telemetry Accent Strips
    [-1.29, 1.29].forEach(az => {
      const strip = regMesh(new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 0.04), materials.cyanGlow));
      strip.position.set(0.1, 1.88, az);
      cargoGroup.add(strip);
    });

    // --- 4. EC BUYING YDLIDAR X2L 360° TURRET & 2x ARDUCAM 5MP OV5647 CAMERAS ---
    const lidarPedestal = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.42, 20), materials.petgArmor));
    lidarPedestal.position.set(0.95, 2.32, 0);
    const lidarRing = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.08, 24), materials.blueAnodized));
    lidarRing.position.set(0.95, 2.56, 0);
    const lidarPuck = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.30, 0.24, 24), materials.darkAnodized));
    lidarPuck.position.set(0.95, 2.72, 0);
    const lidarOptic = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16).rotateZ(Math.PI / 2), materials.sensorOptics));
    lidarOptic.position.set(0.26, 0, 0);
    lidarPuck.add(lidarOptic);
    mastGroup.add(lidarPedestal, lidarRing, lidarPuck);

    // Front & Rear Arducam 5MP 1080P OV5647 Camera Modules
    const frontCamPcb = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.32), materials.arducamPcb));
    frontCamPcb.position.set(2.18, 1.72, 0);
    const frontCamLens = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 16).rotateZ(Math.PI / 2), materials.sensorOptics));
    frontCamLens.position.set(2.26, 1.72, 0);

    const rearCamPcb = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.32), materials.arducamPcb));
    rearCamPcb.position.set(-2.18, 1.72, 0);
    const rearCamLens = regMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 16).rotateZ(Math.PI / 2), materials.sensorOptics));
    rearCamLens.position.set(-2.26, 1.72, 0);
    mastGroup.add(frontCamPcb, frontCamLens, rearCamPcb, rearCamLens);

    // --- 5. INDUSTRIAL LUNAR HANGAR BAY // HQST 100W 9BB SOLAR DOCKING STATION ---
    const dockBase = regMesh(new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 4.4), materials.darkAnodized));
    dockBase.position.set(0, 0.08, 0);
    dockBase.receiveShadow = true;
    dockStationGroup.add(dockBase);

    const dockRamp = regMesh(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 4.2), materials.hazardMat));
    dockRamp.position.set(3.25, 0.04, 0); dockRamp.rotation.z = -0.06;
    dockStationGroup.add(dockRamp);

    // Hangar Side Walls, Portal Frame Ribs & Roof
    [-2.05, 2.05].forEach(wz => {
      const hWall = regMesh(new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.85, 0.14), materials.petgChassis));
      hWall.position.set(-0.15, 1.5, wz);
      hWall.castShadow = true;
      dockStationGroup.add(hWall);
    });
    const hBackWall = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.85, 4.24), materials.petgChassis));
    hBackWall.position.set(-2.7, 1.5, 0);
    const hRoof = regMesh(new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.16, 4.36), materials.titaniumBumper));
    hRoof.position.set(-0.1, 2.95, 0);
    dockStationGroup.add(hBackWall, hRoof);

    // Angled HQST 100W 12V 9BB Monocrystalline Solar Panel on Adjustable Tilt Struts
    const hqstArrayGroup = new THREE.Group();
    hqstArrayGroup.position.set(-0.2, 3.38, 0);
    hqstArrayGroup.rotation.x = -0.18;
    const hqstFrame = regMesh(new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.12, 3.6), materials.titaniumBumper));
    const hqstCells = regMesh(new THREE.Mesh(new THREE.BoxGeometry(4.24, 0.13, 3.44), materials.hqstSolar));
    hqstArrayGroup.add(hqstFrame, hqstCells);
    dockStationGroup.add(hqstArrayGroup);

    // Overhead Magnetic Pogo-Pin Charging Arm & Segmented Hangar Door
    const dockChargeArm = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 0.18), materials.titaniumBumper));
    dockChargeArm.position.set(-0.8, 2.45, 0);
    const dockChargeHead = regMesh(new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.56), materials.emeraldGlow));
    dockChargeHead.position.set(-0.8, 2.02, 0);
    dockStationGroup.add(dockChargeArm, dockChargeHead);

    // --- CAD VIEWPORT CONTROLS ---
    let isWireframe = false;
    let isExploded = false;

    const btnWireframe = document.getElementById('btn-wireframe');
    const btnExplode = document.getElementById('btn-explode');
    const btnResetCam = document.getElementById('btn-reset-cam');

    // Camera Preset Buttons
    const camPresetBtns = document.querySelectorAll('.cam-preset-btn');
    const setCamActive = (activeView) => {
      camPresetBtns.forEach(b => {
        const isActive = (b.dataset.view === activeView);
        b.className = `cam-preset-btn px-2.5 py-1 rounded transition-colors ${
          isActive ? 'bg-white/10 text-white font-medium shadow-sm' : 'hover:text-white text-slate-400'
        }`;
      });
    };
    setCamActive('iso');

    camPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        setCamActive(view);
        if (view === 'iso') {
          camera.position.set(8.5, 5.5, 9.5);
          controls.target.set(-1.2, 1.4, 0);
        } else if (view === 'top') {
          camera.position.set(-2.0, 16, 0.01);
          controls.target.set(-2.0, 1.2, 0);
        } else if (view === 'side') {
          camera.position.set(-2.0, 2.8, 14);
          controls.target.set(-2.0, 1.4, 0);
        } else if (view === 'front') {
          camera.position.set(11, 2.5, 0);
          controls.target.set(0, 1.4, 0);
        }
        controls.update();
      });
    });

    if (btnWireframe) {
      btnWireframe.addEventListener('click', () => {
        isWireframe = !isWireframe;
        inspectableMeshes.forEach(mesh => {
          if (mesh.material) {
            mesh.material.wireframe = isWireframe;
            mesh.material.needsUpdate = true;
          }
        });
        btnWireframe.textContent = isWireframe ? 'Wireframe: ON' : 'Wireframe: OFF';
        btnWireframe.classList.toggle('text-blue-400', isWireframe);
      });
    }

    if (btnExplode) {
      btnExplode.addEventListener('click', () => {
        isExploded = !isExploded;
        btnExplode.textContent = isExploded ? 'Assembly: Exploded' : 'Assembly: Nominal';
        btnExplode.classList.toggle('text-blue-400', isExploded);
      });
    }

    if (btnResetCam) {
      btnResetCam.addEventListener('click', () => {
        camera.position.set(8.5, 5.5, 9.5);
        controls.target.set(-1.2, 1.4, 0);
        controls.update();
        if (typeof setCamActive === 'function') setCamActive('iso');
      });
    }

    // Subsystem Engineering Dossier
    const subsystemData = {
      chassis: {
        title: 'Polymaker Black PETG Armored Shell & Internal Electronics',
        lead: 'Ahrav, Sacheth & Harshan // Mechanical, CAD & Autonomy',
        desc: '3D-printed stealth-black Polymaker PETG shell with M3/M4 brass heat-set inserts, 6x 3007 (30x30x7mm) brushless cooling fans, GOLDENMATE 12V 10Ah LiFePO4 battery (128Wh IP67 BMS), SANOOV Raspberry Pi 5 4GB with Active Cooler, Arduino Uno REV3 (ATmega328P), and YRDZXG 12V/24V-to-5V 5A Buck Converter.'
      },
      locomotion: {
        title: '6x Greartisan DC 12V 100RPM 37mm Rocker-Bogie Drivetrain',
        lead: 'Ahrav & Harshan // Drivetrain & Traction Control',
        desc: 'Articulated 6-wheel rocker-bogie suspension driven by six independent Greartisan 12V 100RPM 37mm centric-shaft spur gear motors with brass hex couplers and deep-chevron TPU/PETG lunar tires.'
      },
      cargobay: {
        title: 'Industrial Lunar Hangar Bay // HQST 100W 9BB Solar Dock',
        lead: 'Sacheth & Harshan // Docking & Power Systems',
        desc: 'Autonomous roll-in garage bay powered by a roof-mounted HQST 100W 12V 9BB monocrystalline solar array (23% efficiency, IP65), wall-mounted MPPT charge controller, segmented overhead door, and articulated magnetic pogo-pin charging arm.'
      },
      avionics: {
        title: 'EC Buying YDLIDAR X2L 360° & Dual Arducam 5MP OV5647 Suite',
        lead: 'Harshan // Autonomous Software & AI Vision Lead',
        desc: '360-degree 8m-radius YDLIDAR X2L laser scanner paired with dual Arducam 5MP 1080P OV5647 camera modules (forward navigation + rear auto-docking alignment) feeding the Raspberry Pi 5 neural autonomy pipeline.'
      }
    };

    const subBtns = document.querySelectorAll('.subsystem-select-btn');
    const subTitle = document.getElementById('cad-subsystem-title');
    const subLead = document.getElementById('cad-subsystem-lead');
    const subDesc = document.getElementById('cad-subsystem-desc');

    subBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const subKey = btn.dataset.subsystem;
        subBtns.forEach(b => {
          b.className = 'subsystem-select-btn px-3 py-2 text-left rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-colors';
        });
        btn.className = 'subsystem-select-btn px-3 py-2 text-left rounded-lg text-xs font-medium text-white bg-slate-800 border border-slate-700 transition-colors';

        if (subsystemData[subKey]) {
          subTitle.textContent = subsystemData[subKey].title;
          subLead.textContent = subsystemData[subKey].lead;
          subDesc.textContent = subsystemData[subKey].desc;
        }

        if (subKey === 'chassis') {
          isExploded = true;
          if (btnExplode) { btnExplode.textContent = 'Assembly: Exploded'; btnExplode.classList.add('text-blue-400'); }
          controls.target.set(0, 1.4, 0);
        }
        if (subKey === 'locomotion') controls.target.set(0, 0.7, 1.5);
        if (subKey === 'cargobay') {
          controls.target.set(-7.2, 1.6, 0);
          camera.position.set(-1.5, 4.8, 7.5);
        }
        if (subKey === 'avionics') controls.target.set(1.1, 2.3, 0);
        controls.update();
      });
    });

    // Window Resize
    window.addEventListener('resize', () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight, false);
    });

    // Render Loop
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (lidarPuck) {
        lidarPuck.rotation.y += 6.0 * delta;
      }
      fanRotors.forEach(r => { r.rotation.z += 18.0 * delta; });
      wheelMeshes.forEach(w => { w.rotation.z -= 0.4 * delta; });

      // Smooth Exploded Animation (lifts stealth-black PETG upper armor to reveal GOLDENMATE LiFePO4, Pi 5, Arduino Uno R3 & Buck Converter)
      const targetCargoY = isExploded ? 1.35 : 0;
      const targetMastY = isExploded ? 1.55 : 0;

      cargoGroup.position.y += (targetCargoY - cargoGroup.position.y) * 0.08;
      mastGroup.position.y += (targetMastY - mastGroup.position.y) * 0.08;

      controls.update();
      renderer.render(scene, camera);
    }

    animate();
  }

  // --- 2. LUNAR SURFACE ROUTE SIMULATION ---
  const simToggleBtn = document.getElementById('btn-sim-toggle');
  const simResetBtn = document.getElementById('btn-sim-reset');
  const simMarker = document.getElementById('rover-sim-marker');
  const simProgressBar = document.getElementById('sim-progress-bar');
  const simDistText = document.getElementById('sim-dist-text');
  const simPctText = document.getElementById('sim-pct-text');
  const metricSpeed = document.getElementById('metric-speed');
  const metricSlope = document.getElementById('metric-slope');
  const metricEta = document.getElementById('metric-eta');

  let isSimRunning = false;
  let simProgress = 0;
  let simAnimId = null;
  const TOTAL_DISTANCE = 850;

  const routePath = document.getElementById('svg-path');

  const updateSimUI = () => {
    const currentMeters = Math.round(simProgress * TOTAL_DISTANCE);
    const pct = Math.round(simProgress * 100);

    if (simProgressBar) simProgressBar.style.width = `${pct}%`;
    if (simDistText) simDistText.textContent = `${currentMeters} m`;
    if (simPctText) simPctText.textContent = `${pct}%`;

    let currX = 60, currY = 170;
    if (routePath && typeof routePath.getTotalLength === 'function') {
      const point = routePath.getPointAtLength(simProgress * routePath.getTotalLength());
      currX = point.x;
      currY = point.y;
    }

    if (simMarker) {
      simMarker.setAttribute('transform', `translate(${currX}, ${currY})`);
    }

    if (simProgress === 0) {
      if (metricSpeed) metricSpeed.textContent = '0.0 km/h';
      if (metricSlope) metricSlope.textContent = '+1.8°';
      if (metricEta) metricEta.textContent = '--:--';
    } else if (simProgress < 0.98) {      const nearCrater = Math.hypot(currX - 280, currY - 185) < 46;
      const nearBoulder = Math.hypot(currX - 510, currY - 175) < 38;

      let currentSpeed = 5.2 + Math.sin(simProgress * 15) * 0.6;
      if (nearCrater) {
        currentSpeed = 3.4;
        if (metricSlope) metricSlope.textContent = '+6.4° (Crater Margin)';
      } else if (nearBoulder) {
        currentSpeed = 3.8;
        if (metricSlope) metricSlope.textContent = '+4.2° (Boulder Field)';
      } else {
        if (metricSlope) metricSlope.textContent = '+2.1°';
      }
      if (metricSpeed) metricSpeed.textContent = `${currentSpeed.toFixed(1)} km/h`;

      const remainingSecs = Math.max(0, Math.round((1 - simProgress) * 580));
      const mins = Math.floor(remainingSecs / 60);
      const secs = remainingSecs % 60;
      if (metricEta) metricEta.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
      if (metricSpeed) metricSpeed.textContent = '0.0 km/h (Docked)';
      if (metricSlope) metricSlope.textContent = '0.0°';
      if (metricEta) metricEta.textContent = '00:00';
    }
  };

  const simStep = () => {
    if (!isSimRunning) return;
    simProgress += 0.002;
    if (simProgress >= 1) {
      simProgress = 1;
      isSimRunning = false;
      if (simToggleBtn) simToggleBtn.textContent = 'Transit Complete';
    }
    updateSimUI();
    if (isSimRunning) {
      simAnimId = requestAnimationFrame(simStep);
    }
  };

  if (simToggleBtn) {
    simToggleBtn.addEventListener('click', () => {
      cancelAnimationFrame(simAnimId);
      if (simProgress >= 1) simProgress = 0;
      isSimRunning = !isSimRunning;
      simToggleBtn.textContent = isSimRunning ? 'Pause Simulation' : 'Resume Simulation';
      if (isSimRunning) {
        simStep();
      }
    });
  }

  if (simResetBtn) {
    simResetBtn.addEventListener('click', () => {
      isSimRunning = false;
      simProgress = 0;
      cancelAnimationFrame(simAnimId);
      if (simToggleBtn) simToggleBtn.textContent = 'Start Simulation';
      updateSimUI();
    });
  }

  // --- 3. PAYLOAD MASS & ENERGY CALCULATOR ---
  const cargoCheckboxes = document.querySelectorAll('.cargo-checkbox');
  const calcMassEarth = document.getElementById('calc-mass-earth');
  const calcWeightLunar = document.getElementById('calc-weight-lunar');
  const calcCapacityPct = document.getElementById('calc-capacity-pct');
  const calcCapacityBar = document.getElementById('calc-capacity-bar');
  const calcCogOffset = document.getElementById('calc-cog-offset');
  const calcPowerEst = document.getElementById('calc-power-est');

  const updateCalculator = () => {
    let totalEarthKg = 0;
    let totalEnergyKwh = 0;
    let count = 0;

    cargoCheckboxes.forEach(cb => {
      if (cb.checked) {
        totalEarthKg += parseFloat(cb.dataset.mass || 0);
        totalEnergyKwh += parseFloat(cb.dataset.power || 0);
        count++;
      }
    });

    const lunarGravity = 1.622; // m/s^2 — weight changes, inertial mass does not
    const lunarWeightN = (totalEarthKg * lunarGravity).toFixed(1);
    const maxCapacity = 500;
    const capacityRatio = (totalEarthKg / maxCapacity) * 100;
    const capacityPct = capacityRatio.toFixed(1);

    if (calcMassEarth) calcMassEarth.textContent = `${totalEarthKg.toFixed(1)} kg`;
    if (calcWeightLunar) calcWeightLunar.textContent = `${lunarWeightN} N`;
    if (calcCapacityPct) calcCapacityPct.textContent = `${capacityPct}%`;
    if (calcCapacityBar) {
      calcCapacityBar.style.width = `${Math.min(100, capacityRatio)}%`;
      calcCapacityBar.classList.toggle('bg-red-500', totalEarthKg > maxCapacity);
      calcCapacityBar.classList.toggle('bg-blue-500', totalEarthKg <= maxCapacity);
    }
    if (calcPowerEst) calcPowerEst.textContent = `${(totalEnergyKwh + 1.2).toFixed(1)} kWh`;

    if (calcCogOffset) {
      if (totalEarthKg > maxCapacity) {
        calcCogOffset.textContent = 'Exceeds Structural Envelope';
        calcCogOffset.className = 'font-mono text-sm text-red-400 font-semibold';
      } else if (totalEarthKg === 0) {
        calcCogOffset.textContent = 'Neutral (0.0 cm)';
        calcCogOffset.className = 'font-mono text-sm text-slate-400';
      } else {
        calcCogOffset.textContent = `+${(0.6 + count * 0.4).toFixed(1)} cm (Within Margin)`;
        calcCogOffset.className = 'font-mono text-sm text-emerald-400 font-medium';
      }
    }
  };

  cargoCheckboxes.forEach(cb => cb.addEventListener('change', updateCalculator));
  updateCalculator();

  // Mode Selection
  document.querySelectorAll('.mode-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-switch-btn').forEach(b => {
        b.className = 'mode-switch-btn px-2.5 py-1 text-xs font-medium rounded text-slate-400 hover:text-white transition-colors';
      });
      btn.className = 'mode-switch-btn px-2.5 py-1 text-xs font-medium rounded bg-blue-600 text-white transition-colors';
    });
  });

});
