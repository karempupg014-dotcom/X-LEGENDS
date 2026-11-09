import * as THREE from 'three';
import {
  getCobblestoneTexture,
  getGrassTexture,
  getDirtPathTexture,
  getMedievalWallTexture,
  getRoofTileTexture,
  getBarkTexture,
  getAggroRingTexture,
  getWaterTexture,
} from './textures';

// Shared materials to keep draw calls low
const materials = {
  steel: new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.25,
  }),
  steelDark: new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.8,
    roughness: 0.35,
  }),
  gold: new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.2,
  }),
  crimsonFabric: new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.85,
    side: THREE.DoubleSide,
  }),
  leather: new THREE.MeshStandardMaterial({
    color: 0x54361c,
    roughness: 0.7,
  }),
  wood: new THREE.MeshStandardMaterial({
    map: getBarkTexture(),
    roughness: 0.85,
  }),
  leavesOak: new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.7,
    flatShading: true,
  }),
  leavesPine: new THREE.MeshStandardMaterial({
    color: 0x1b4332,
    roughness: 0.65,
    flatShading: true,
  }),
  rock: new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.9,
    flatShading: true,
  }),
  glowBlue: new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
  }),
  glowPurple: new THREE.MeshBasicMaterial({
    color: 0xa855f7,
  }),
  glowRed: new THREE.MeshBasicMaterial({
    color: 0xef4444,
  }),
};

export interface WarriorJoints {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  cape: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  swordGroup: THREE.Group;
  shieldGroup: THREE.Group;
  slashArc: THREE.Mesh;
}

/**
 * Creates the detailed 3D Armored Warrior with proper proportions,
 * layered plate armor, heraldic lion shield, rune broadsword, and articulation joints.
 */
export function createWarrior3D(): { group: THREE.Group; joints: WarriorJoints } {
  const root = new THREE.Group();
  root.name = 'Warrior_Root';

  // Overall scale: warrior stands ~1.9m tall
  const warriorGroup = new THREE.Group();
  warriorGroup.position.y = 0;
  root.add(warriorGroup);

  // 1. Torso & Upper Body Group (pivot at hips Y=0.95)
  const torso = new THREE.Group();
  torso.position.y = 0.95;
  warriorGroup.add(torso);

  // Breastplate (curved front plate)
  const chestGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.45, 8);
  chestGeo.scale(1.25, 1, 0.85);
  const chestMesh = new THREE.Mesh(chestGeo, materials.steel);
  chestMesh.position.y = 0.22;
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Golden lion chest emblem / crest plate
  const emblemGeo = new THREE.BoxGeometry(0.12, 0.16, 0.04);
  const emblemMesh = new THREE.Mesh(emblemGeo, materials.gold);
  emblemMesh.position.set(0, 0.24, 0.19);
  torso.add(emblemMesh);

  // Leather belt & brass buckle at waist
  const beltGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12);
  const beltMesh = new THREE.Mesh(beltGeo, materials.leather);
  beltMesh.position.y = 0.02;
  torso.add(beltMesh);

  const buckleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
  const buckleMesh = new THREE.Mesh(buckleGeo, materials.gold);
  buckleMesh.position.set(0, 0.02, 0.22);
  torso.add(buckleMesh);

  // Tassets (hip armor plates)
  const tassetGeo = new THREE.BoxGeometry(0.14, 0.18, 0.04);
  const tassetLeft = new THREE.Mesh(tassetGeo, materials.steel);
  tassetLeft.position.set(-0.16, -0.06, 0.08);
  tassetLeft.rotation.z = 0.1;
  torso.add(tassetLeft);

  const tassetRight = new THREE.Mesh(tassetGeo, materials.steel);
  tassetRight.position.set(0.16, -0.06, 0.08);
  tassetRight.rotation.z = -0.1;
  torso.add(tassetRight);

  // 2. Head & Helmet Group (pivot at neck Y=0.48 above torso)
  const head = new THREE.Group();
  head.position.y = 0.48;
  torso.add(head);

  // Helmet bowl
  const helmGeo = new THREE.SphereGeometry(0.16, 12, 10);
  helmGeo.scale(1, 1.15, 1.1);
  const helmMesh = new THREE.Mesh(helmGeo, materials.steel);
  helmMesh.position.y = 0.08;
  helmMesh.castShadow = true;
  head.add(helmMesh);

  // Visor eye-slit
  const visorGeo = new THREE.BoxGeometry(0.18, 0.035, 0.08);
  const visorMesh = new THREE.Mesh(visorGeo, materials.steelDark);
  visorMesh.position.set(0, 0.08, 0.14);
  head.add(visorMesh);

  // Helmet central comb / ridge
  const combGeo = new THREE.BoxGeometry(0.04, 0.1, 0.26);
  const combMesh = new THREE.Mesh(combGeo, materials.gold);
  combMesh.position.set(0, 0.22, 0);
  head.add(combMesh);

  // Crimson flowing plume
  const plumeGeo = new THREE.ConeGeometry(0.06, 0.28, 6);
  plumeGeo.rotateX(-Math.PI * 0.4);
  const plumeMesh = new THREE.Mesh(plumeGeo, materials.crimsonFabric);
  plumeMesh.position.set(0, 0.25, -0.12);
  head.add(plumeMesh);

  // 3. Flowing Royal Cape attached behind shoulders
  const capeGeo = new THREE.PlaneGeometry(0.48, 0.85, 4, 6);
  capeGeo.translate(0, -0.42, 0);
  const cape = new THREE.Mesh(capeGeo, materials.crimsonFabric);
  cape.position.set(0, 0.4, -0.2);
  cape.rotation.x = 0.15;
  cape.castShadow = true;
  torso.add(cape);

  // 4. Left Arm & Shield (pivot at left shoulder)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.32, 0.38, 0);
  torso.add(leftArm);

  // Pauldron (shoulder plate) with gold bevel
  const pauldronLeftGeo = new THREE.SphereGeometry(0.14, 8, 8);
  pauldronLeftGeo.scale(1.2, 0.9, 1.2);
  const pauldronLeft = new THREE.Mesh(pauldronLeftGeo, materials.steel);
  pauldronLeft.position.set(0, 0.02, 0);
  pauldronLeft.castShadow = true;
  leftArm.add(pauldronLeft);

  const pauldronTrimLeft = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 6, 12), materials.gold);
  pauldronTrimLeft.rotation.x = Math.PI / 2;
  leftArm.add(pauldronTrimLeft);

  // Upper & Lower Arm (holding shield ready)
  const armLeftMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.38, 8), materials.steelDark);
  armLeftMesh.position.y = -0.2;
  armLeftMesh.castShadow = true;
  leftArm.add(armLeftMesh);

  // Shield Group
  const shieldGroup = new THREE.Group();
  shieldGroup.position.set(-0.12, -0.22, 0.15);
  shieldGroup.rotation.y = 0.3;
  leftArm.add(shieldGroup);

  // Kite Shield Body
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(-0.2, 0.3);
  shieldShape.lineTo(0.2, 0.3);
  shieldShape.lineTo(0.2, 0.0);
  shieldShape.lineTo(0.0, -0.38);
  shieldShape.lineTo(-0.2, 0.0);
  shieldShape.closePath();

  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.015,
    bevelThickness: 0.015,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, materials.steel);
  shieldMesh.castShadow = true;
  shieldGroup.add(shieldMesh);

  // Shield Golden Border & Lion Emblem
  const shieldEmblemGeo = new THREE.BoxGeometry(0.12, 0.18, 0.06);
  const shieldEmblem = new THREE.Mesh(shieldEmblemGeo, materials.gold);
  shieldEmblem.position.set(0, 0.08, 0.02);
  shieldGroup.add(shieldEmblem);

  // 5. Right Arm & Great Broadsword (pivot at right shoulder)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.32, 0.38, 0);
  torso.add(rightArm);

  const pauldronRightGeo = new THREE.SphereGeometry(0.14, 8, 8);
  pauldronRightGeo.scale(1.2, 0.9, 1.2);
  const pauldronRight = new THREE.Mesh(pauldronRightGeo, materials.steel);
  pauldronRight.position.set(0, 0.02, 0);
  pauldronRight.castShadow = true;
  rightArm.add(pauldronRight);

  const pauldronTrimRight = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 6, 12), materials.gold);
  pauldronTrimRight.rotation.x = Math.PI / 2;
  rightArm.add(pauldronTrimRight);

  const armRightMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.38, 8), materials.steelDark);
  armRightMesh.position.y = -0.2;
  armRightMesh.castShadow = true;
  rightArm.add(armRightMesh);

  // Gauntlet & Sword Pivot
  const swordGroup = new THREE.Group();
  swordGroup.position.set(0, -0.36, 0.08);
  rightArm.add(swordGroup);

  // Sword Crossguard
  const guardGeo = new THREE.BoxGeometry(0.32, 0.045, 0.06);
  const guardMesh = new THREE.Mesh(guardGeo, materials.gold);
  swordGroup.add(guardMesh);

  // Sword Grip & Pommel
  const hiltGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8);
  const hiltMesh = new THREE.Mesh(hiltGeo, materials.leather);
  hiltMesh.position.y = -0.1;
  swordGroup.add(hiltMesh);

  const pommelGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const pommelMesh = new THREE.Mesh(pommelGeo, materials.gold);
  pommelMesh.position.y = -0.21;
  swordGroup.add(pommelMesh);

  // Broadsword Steel Blade (Tapered double-edged blade, length 1.1m)
  const bladeGeo = new THREE.BoxGeometry(0.1, 1.05, 0.02);
  bladeGeo.translate(0, 0.55, 0);
  const bladeMesh = new THREE.Mesh(bladeGeo, materials.steel);
  bladeMesh.castShadow = true;
  swordGroup.add(bladeMesh);

  // Glowing runic channel in center of sword blade
  const runeGeo = new THREE.BoxGeometry(0.02, 0.8, 0.025);
  runeGeo.translate(0, 0.52, 0);
  const runeMesh = new THREE.Mesh(runeGeo, materials.glowBlue);
  swordGroup.add(runeMesh);

  // Whirlwind / Slash Arc Effect (hidden by default, rotated during combat)
  const arcGeo = new THREE.RingGeometry(0.8, 1.4, 24, 1, 0, Math.PI * 1.4);
  arcGeo.rotateX(-Math.PI / 2);
  const arcMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
  });
  const slashArc = new THREE.Mesh(arcGeo, arcMat);
  slashArc.position.y = 0.9;
  warriorGroup.add(slashArc);

  // 6. Legs (pivots at hips Y=0.95)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.95, 0);
  warriorGroup.add(leftLeg);

  // Upper leg (cuisse)
  const cuisseLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.45, 8), materials.steel);
  cuisseLeft.position.y = -0.225;
  cuisseLeft.castShadow = true;
  leftLeg.add(cuisseLeft);

  // Knee poleyn
  const kneeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), materials.gold);
  kneeLeft.position.set(0, -0.45, 0.04);
  leftLeg.add(kneeLeft);

  // Lower leg & Boot (greave + sabaton)
  const bootLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.45, 8), materials.steelDark);
  bootLeft.position.y = -0.68;
  bootLeft.castShadow = true;
  leftLeg.add(bootLeft);

  const footLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.22), materials.steel);
  footLeft.position.set(0, -0.9, 0.06);
  footLeft.castShadow = true;
  leftLeg.add(footLeft);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.95, 0);
  warriorGroup.add(rightLeg);

  const cuisseRight = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.45, 8), materials.steel);
  cuisseRight.position.y = -0.225;
  cuisseRight.castShadow = true;
  rightLeg.add(cuisseRight);

  const kneeRight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), materials.gold);
  kneeRight.position.set(0, -0.45, 0.04);
  rightLeg.add(kneeRight);

  const bootRight = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.45, 8), materials.steelDark);
  bootRight.position.y = -0.68;
  bootRight.castShadow = true;
  rightLeg.add(bootRight);

  const footRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.22), materials.steel);
  footRight.position.set(0, -0.9, 0.06);
  footRight.castShadow = true;
  rightLeg.add(footRight);

  const joints: WarriorJoints = {
    root,
    torso,
    head,
    cape,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    swordGroup,
    shieldGroup,
    slashArc,
  };

  return { group: root, joints };
}

/**
 * Creates 3D Aggro Radius Ring on ground
 */
export function createAggroRing3D(radius: number): {
  mesh: THREE.Mesh;
  setAggro: (isAggro: boolean) => void;
  setVisible: (visible: boolean) => void;
} {
  const geo = new THREE.RingGeometry(radius - 0.2, radius + 0.1, 32);
  geo.rotateX(-Math.PI / 2);

  const normalMat = new THREE.MeshBasicMaterial({
    map: getAggroRingTexture(false),
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const aggroMat = new THREE.MeshBasicMaterial({
    map: getAggroRingTexture(true),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, normalMat);
  mesh.position.y = 0.05; // hover slightly above terrain

  return {
    mesh,
    setAggro: (isAggro: boolean) => {
      mesh.material = isAggro ? aggroMat : normalMat;
    },
    setVisible: (visible: boolean) => {
      mesh.visible = visible;
    },
  };
}

/**
 * 1. Forest Wolf 3D Model
 */
export function createWolf3D(): {
  group: THREE.Group;
  updateAnim: (timer: number, isMoving: boolean, isAttacking: boolean) => void;
} {
  const group = new THREE.Group();
  group.name = 'Monster_Wolf';

  const wolfMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // slate grey fur
    roughness: 0.9,
  });
  const wolfBellyMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // lighter underbelly
    roughness: 0.9,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // glowing amber eyes

  // Body
  const body = new THREE.Group();
  body.position.y = 0.65;
  group.add(body);

  const chestGeo = new THREE.BoxGeometry(0.4, 0.45, 0.7);
  const chestMesh = new THREE.Mesh(chestGeo, wolfMat);
  chestMesh.castShadow = true;
  body.add(chestMesh);

  // Underbelly
  const bellyGeo = new THREE.BoxGeometry(0.32, 0.15, 0.6);
  const bellyMesh = new THREE.Mesh(bellyGeo, wolfBellyMat);
  bellyMesh.position.y = -0.18;
  body.add(bellyMesh);

  // Head & Neck
  const neck = new THREE.Group();
  neck.position.set(0, 0.22, 0.35);
  body.add(neck);

  const headGeo = new THREE.ConeGeometry(0.22, 0.45, 6);
  headGeo.rotateX(Math.PI / 2);
  const headMesh = new THREE.Mesh(headGeo, wolfMat);
  headMesh.castShadow = true;
  neck.add(headMesh);

  // Pointed ears
  const earGeo = new THREE.ConeGeometry(0.08, 0.18, 4);
  const leftEar = new THREE.Mesh(earGeo, wolfMat);
  leftEar.position.set(-0.12, 0.22, -0.05);
  neck.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, wolfMat);
  rightEar.position.set(0.12, 0.22, -0.05);
  neck.add(rightEar);

  // Glowing eyes
  const eyeGeo = new THREE.SphereGeometry(0.035, 6, 6);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.08, 0.08, 0.16);
  neck.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.08, 0.08, 0.16);
  neck.add(rightEye);

  // Bushy Tail
  const tail = new THREE.Group();
  tail.position.set(0, 0.1, -0.38);
  body.add(tail);

  const tailGeo = new THREE.CylinderGeometry(0.05, 0.12, 0.45, 6);
  tailGeo.rotateX(-0.5);
  const tailMesh = new THREE.Mesh(tailGeo, wolfMat);
  tailMesh.position.set(0, -0.15, -0.15);
  tail.add(tailMesh);

  // 4 Legs
  const legGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.55, 6);
  const flLeg = new THREE.Mesh(legGeo, wolfMat);
  flLeg.position.set(-0.16, 0.28, 0.24);
  flLeg.castShadow = true;
  group.add(flLeg);

  const frLeg = new THREE.Mesh(legGeo, wolfMat);
  frLeg.position.set(0.16, 0.28, 0.24);
  frLeg.castShadow = true;
  group.add(frLeg);

  const blLeg = new THREE.Mesh(legGeo, wolfMat);
  blLeg.position.set(-0.16, 0.28, -0.24);
  blLeg.castShadow = true;
  group.add(blLeg);

  const brLeg = new THREE.Mesh(legGeo, wolfMat);
  brLeg.position.set(0.16, 0.28, -0.24);
  brLeg.castShadow = true;
  group.add(brLeg);

  return {
    group,
    updateAnim: (timer: number, isMoving: boolean, isAttacking: boolean) => {
      if (isAttacking) {
        neck.rotation.x = Math.sin(timer * 15) * 0.4;
        body.position.y = 0.65 + Math.sin(timer * 15) * 0.15;
      } else if (isMoving) {
        const stride = Math.sin(timer * 10);
        flLeg.rotation.x = stride * 0.6;
        frLeg.rotation.x = -stride * 0.6;
        blLeg.rotation.x = -stride * 0.6;
        brLeg.rotation.x = stride * 0.6;
        tail.rotation.y = Math.sin(timer * 8) * 0.3;
        body.position.y = 0.65 + Math.abs(Math.sin(timer * 10)) * 0.06;
      } else {
        flLeg.rotation.x = 0;
        frLeg.rotation.x = 0;
        blLeg.rotation.x = 0;
        brLeg.rotation.x = 0;
        tail.rotation.y = Math.sin(timer * 2) * 0.15;
        body.position.y = 0.65 + Math.sin(timer * 2) * 0.02;
      }
    },
  };
}

/**
 * 2. Wild Boar 3D Model
 */
export function createBoar3D(): {
  group: THREE.Group;
  updateAnim: (timer: number, isMoving: boolean, isAttacking: boolean) => void;
} {
  const group = new THREE.Group();
  group.name = 'Monster_Boar';

  const boarMat = new THREE.MeshStandardMaterial({
    color: 0x542b10, // earthy brown
    roughness: 0.9,
  });
  const tuskMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7, // ivory
    roughness: 0.4,
  });

  const body = new THREE.Group();
  body.position.y = 0.55;
  group.add(body);

  // Barrel Body
  const barrelGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.8, 8);
  barrelGeo.rotateX(Math.PI / 2);
  const barrelMesh = new THREE.Mesh(barrelGeo, boarMat);
  barrelMesh.castShadow = true;
  body.add(barrelMesh);

  // Bristled back crest
  const crestGeo = new THREE.BoxGeometry(0.12, 0.15, 0.7);
  const crestMesh = new THREE.Mesh(crestGeo, materials.steelDark);
  crestMesh.position.y = 0.36;
  body.add(crestMesh);

  // Head & Snout
  const headGeo = new THREE.ConeGeometry(0.32, 0.5, 6);
  headGeo.rotateX(Math.PI / 2);
  const headMesh = new THREE.Mesh(headGeo, boarMat);
  headMesh.position.set(0, 0.05, 0.45);
  headMesh.castShadow = true;
  body.add(headMesh);

  // Pair of curved ivory tusks
  const tuskGeo = new THREE.ConeGeometry(0.04, 0.22, 5);
  tuskGeo.rotateX(-0.5);
  const leftTusk = new THREE.Mesh(tuskGeo, tuskMat);
  leftTusk.position.set(-0.18, -0.05, 0.6);
  body.add(leftTusk);

  const rightTusk = new THREE.Mesh(tuskGeo, tuskMat);
  rightTusk.position.set(0.18, -0.05, 0.6);
  body.add(rightTusk);

  // 4 Sturdy legs
  const legGeo = new THREE.CylinderGeometry(0.08, 0.065, 0.45, 6);
  const flLeg = new THREE.Mesh(legGeo, boarMat);
  flLeg.position.set(-0.2, 0.22, 0.25);
  flLeg.castShadow = true;
  group.add(flLeg);

  const frLeg = new THREE.Mesh(legGeo, boarMat);
  frLeg.position.set(0.2, 0.22, 0.25);
  frLeg.castShadow = true;
  group.add(frLeg);

  const blLeg = new THREE.Mesh(legGeo, boarMat);
  blLeg.position.set(-0.2, 0.22, -0.25);
  blLeg.castShadow = true;
  group.add(blLeg);

  const brLeg = new THREE.Mesh(legGeo, boarMat);
  brLeg.position.set(0.2, 0.22, -0.25);
  brLeg.castShadow = true;
  group.add(brLeg);

  return {
    group,
    updateAnim: (timer: number, isMoving: boolean, isAttacking: boolean) => {
      if (isAttacking) {
        body.rotation.x = Math.sin(timer * 16) * 0.35;
      } else if (isMoving) {
        const stride = Math.sin(timer * 8);
        flLeg.rotation.x = stride * 0.5;
        frLeg.rotation.x = -stride * 0.5;
        blLeg.rotation.x = -stride * 0.5;
        brLeg.rotation.x = stride * 0.5;
      } else {
        flLeg.rotation.x = 0;
        frLeg.rotation.x = 0;
        blLeg.rotation.x = 0;
        brLeg.rotation.x = 0;
      }
    },
  };
}

/**
 * 3. Shadow Goblin 3D Model
 */
export function createGoblin3D(): {
  group: THREE.Group;
  updateAnim: (timer: number, isMoving: boolean, isAttacking: boolean) => void;
} {
  const group = new THREE.Group();
  group.name = 'Monster_Goblin';

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // goblin green
    roughness: 0.8,
  });
  const ragsMat = new THREE.MeshStandardMaterial({
    color: 0x3f2a1d, // ragged leather
    roughness: 0.9,
  });

  const body = new THREE.Group();
  body.position.y = 0.5;
  group.add(body);

  // Hunched torso
  const torsoGeo = new THREE.BoxGeometry(0.28, 0.35, 0.22);
  const torsoMesh = new THREE.Mesh(torsoGeo, ragsMat);
  torsoMesh.rotation.x = 0.25;
  torsoMesh.castShadow = true;
  body.add(torsoMesh);

  // Goblin head with big pointy ears
  const head = new THREE.Group();
  head.position.set(0, 0.28, 0.1);
  body.add(head);

  const headGeo = new THREE.SphereGeometry(0.14, 8, 8);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Long ears
  const earGeo = new THREE.ConeGeometry(0.06, 0.24, 4);
  earGeo.rotateZ(Math.PI / 2);
  const leftEar = new THREE.Mesh(earGeo, skinMat);
  leftEar.position.set(-0.2, 0.04, 0);
  head.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMat);
  rightEar.rotation.z = Math.PI;
  rightEar.position.set(0.2, 0.04, 0);
  head.add(rightEar);

  // Glowing red eyes
  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), materials.glowRed);
  eyeLeft.position.set(-0.06, 0.03, 0.12);
  head.add(eyeLeft);

  const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), materials.glowRed);
  eyeRight.position.set(0.06, 0.03, 0.12);
  head.add(eyeRight);

  // Right arm holding rusty dagger
  const arm = new THREE.Group();
  arm.position.set(0.2, 0.15, 0);
  body.add(arm);

  const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.3, 6), skinMat);
  armMesh.position.set(0.05, -0.1, 0.08);
  arm.add(armMesh);

  const daggerGeo = new THREE.BoxGeometry(0.04, 0.35, 0.015);
  const daggerMesh = new THREE.Mesh(daggerGeo, materials.steelDark);
  daggerMesh.position.set(0.05, -0.22, 0.2);
  daggerMesh.rotation.x = Math.PI / 3;
  arm.add(daggerMesh);

  // Legs
  const legLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.4, 6), skinMat);
  legLeft.position.set(-0.1, 0.2, 0);
  legLeft.castShadow = true;
  group.add(legLeft);

  const legRight = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.4, 6), skinMat);
  legRight.position.set(0.1, 0.2, 0);
  legRight.castShadow = true;
  group.add(legRight);

  return {
    group,
    updateAnim: (timer: number, isMoving: boolean, isAttacking: boolean) => {
      if (isAttacking) {
        arm.rotation.x = Math.sin(timer * 20) * 0.8;
      } else if (isMoving) {
        const stride = Math.sin(timer * 12);
        legLeft.rotation.x = stride * 0.6;
        legRight.rotation.x = -stride * 0.6;
        body.position.y = 0.5 + Math.abs(stride) * 0.05;
      } else {
        legLeft.rotation.x = 0;
        legRight.rotation.x = 0;
        body.position.y = 0.5 + Math.sin(timer * 3) * 0.02;
      }
    },
  };
}

/**
 * 4. Crimson Viper 3D Model
 */
export function createViper3D(): {
  group: THREE.Group;
  updateAnim: (timer: number, isMoving: boolean, isAttacking: boolean) => void;
} {
  const group = new THREE.Group();
  group.name = 'Monster_Viper';

  const viperMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b, // crimson scales
    roughness: 0.5,
  });
  const underMat = new THREE.MeshStandardMaterial({
    color: 0xfca5a5, // soft salmon belly
    roughness: 0.6,
  });

  // Multiple articulated snake segments
  const segments: THREE.Mesh[] = [];
  const numSegments = 6;
  for (let i = 0; i < numSegments; i++) {
    const r = 0.12 - i * 0.015;
    const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), i % 2 === 0 ? viperMat : underMat);
    seg.position.set(0, r, -i * 0.22);
    seg.castShadow = true;
    group.add(seg);
    segments.push(seg);
  }

  // Viper Head & Flared Hood
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.35, 0.15);
  group.add(headGroup);

  const headGeo = new THREE.ConeGeometry(0.14, 0.35, 6);
  headGeo.rotateX(Math.PI / 2);
  const headMesh = new THREE.Mesh(headGeo, viperMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Flared Cobra Hood
  const hoodGeo = new THREE.BoxGeometry(0.36, 0.22, 0.04);
  const hoodMesh = new THREE.Mesh(hoodGeo, viperMat);
  hoodMesh.position.set(0, -0.05, -0.08);
  headGroup.add(hoodMesh);

  // Glowing yellow slit eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), materials.gold);
  eyeL.position.set(-0.08, 0.05, 0.1);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), materials.gold);
  eyeR.position.set(0.08, 0.05, 0.1);
  headGroup.add(eyeR);

  // Forked tongue
  const tongueGeo = new THREE.BoxGeometry(0.02, 0.01, 0.15);
  const tongueMesh = new THREE.Mesh(tongueGeo, materials.glowRed);
  tongueMesh.position.set(0, -0.02, 0.22);
  headGroup.add(tongueMesh);

  return {
    group,
    updateAnim: (timer: number, isMoving: boolean, isAttacking: boolean) => {
      // Undulating serpentine movement
      segments.forEach((seg, idx) => {
        seg.position.x = Math.sin(timer * 6 - idx * 0.8) * 0.16;
      });
      if (isAttacking) {
        headGroup.position.y = 0.35 + Math.sin(timer * 15) * 0.2;
        headGroup.position.z = 0.15 + Math.cos(timer * 15) * 0.15;
      } else {
        headGroup.position.x = Math.sin(timer * 4) * 0.08;
      }
    },
  };
}

/**
 * 5. Corrupted Treant Boss 3D Model
 */
export function createTreantBoss3D(): {
  group: THREE.Group;
  updateAnim: (timer: number, isMoving: boolean, isAttacking: boolean) => void;
} {
  const group = new THREE.Group();
  group.name = 'Monster_Treant_Boss';
  group.scale.set(1.6, 1.6, 1.6); // Boss scale!

  const body = new THREE.Group();
  body.position.y = 1.4;
  group.add(body);

  // Massive twisted oak trunk torso
  const trunkGeo = new THREE.CylinderGeometry(0.55, 0.75, 1.5, 8);
  const trunkMesh = new THREE.Mesh(trunkGeo, materials.wood);
  trunkMesh.castShadow = true;
  body.add(trunkMesh);

  // Glowing corrupted heart inside trunk cavity
  const heartGeo = new THREE.IcosahedronGeometry(0.24, 1);
  const heartMesh = new THREE.Mesh(heartGeo, materials.glowPurple);
  heartMesh.position.set(0, 0.1, 0.45);
  body.add(heartMesh);

  // Leafy shoulder canopies
  const foliageGeo = new THREE.DodecahedronGeometry(0.65);
  const foliageLeft = new THREE.Mesh(foliageGeo, materials.leavesOak);
  foliageLeft.position.set(-0.85, 0.8, 0);
  foliageLeft.castShadow = true;
  body.add(foliageLeft);

  const foliageRight = new THREE.Mesh(foliageGeo, materials.leavesOak);
  foliageRight.position.set(0.85, 0.8, 0);
  foliageRight.castShadow = true;
  body.add(foliageRight);

  const foliageTop = new THREE.Mesh(foliageGeo, materials.leavesOak);
  foliageTop.position.set(0, 1.1, 0);
  foliageTop.castShadow = true;
  body.add(foliageTop);

  // Heavy clawed branch arms
  const armLeft = new THREE.Group();
  armLeft.position.set(-0.75, 0.3, 0);
  body.add(armLeft);

  const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.1, 6), materials.wood);
  armMeshL.position.y = -0.55;
  armMeshL.castShadow = true;
  armLeft.add(armMeshL);

  const armRight = new THREE.Group();
  armRight.position.set(0.75, 0.3, 0);
  body.add(armRight);

  const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.1, 6), materials.wood);
  armMeshR.position.y = -0.55;
  armMeshR.castShadow = true;
  armRight.add(armMeshR);

  // Root legs
  const legLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.8, 6), materials.wood);
  legLeft.position.set(-0.35, 0.4, 0);
  legLeft.castShadow = true;
  group.add(legLeft);

  const legRight = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.8, 6), materials.wood);
  legRight.position.set(0.35, 0.4, 0);
  legRight.castShadow = true;
  group.add(legRight);

  return {
    group,
    updateAnim: (timer: number, isMoving: boolean, isAttacking: boolean) => {
      // Pulse corrupted heart
      const pulse = 1.0 + Math.sin(timer * 5) * 0.15;
      heartMesh.scale.set(pulse, pulse, pulse);

      if (isAttacking) {
        armLeft.rotation.x = Math.sin(timer * 8) * 0.9;
        armRight.rotation.x = -Math.sin(timer * 8) * 0.9;
      } else if (isMoving) {
        legLeft.rotation.x = Math.sin(timer * 4) * 0.4;
        legRight.rotation.x = -Math.sin(timer * 4) * 0.4;
        body.position.y = 1.4 + Math.abs(Math.sin(timer * 4)) * 0.1;
      } else {
        body.position.y = 1.4 + Math.sin(timer * 2) * 0.04;
      }
    },
  };
}

/**
 * Town Environment: Central Fountain 3D Model
 */
export function createFountain3D(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Fountain_3D';

  // Basin outer stone wall
  const basinGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.7, 16);
  const basinMesh = new THREE.Mesh(basinGeo, materials.steelDark);
  basinMesh.position.y = 0.35;
  basinMesh.castShadow = true;
  basinMesh.receiveShadow = true;
  group.add(basinMesh);

  // Water plane
  const waterGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.05, 16);
  const waterMat = new THREE.MeshStandardMaterial({
    map: getWaterTexture(),
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = 0.65;
  group.add(waterMesh);

  // Central sculpted fountain column
  const colGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.8, 12);
  const colMesh = new THREE.Mesh(colGeo, materials.steelDark);
  colMesh.position.y = 1.0;
  colMesh.castShadow = true;
  group.add(colMesh);

  // Upper basin
  const upperBasinGeo = new THREE.CylinderGeometry(0.9, 0.6, 0.35, 12);
  const upperBasinMesh = new THREE.Mesh(upperBasinGeo, materials.steelDark);
  upperBasinMesh.position.y = 1.8;
  upperBasinMesh.castShadow = true;
  group.add(upperBasinMesh);

  // Glowing Angelic / Mythic crest on top
  const crownGeo = new THREE.OctahedronGeometry(0.28);
  const crownMesh = new THREE.Mesh(crownGeo, materials.gold);
  crownMesh.position.y = 2.2;
  group.add(crownMesh);

  return group;
}

/**
 * Town Environment: Medieval Tavern / Guild Hall
 */
export function createTavern3D(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Tavern_3D';

  const wallMat = new THREE.MeshStandardMaterial({
    map: getMedievalWallTexture(),
    roughness: 0.8,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: getRoofTileTexture(),
    roughness: 0.6,
  });

  // Main 2-story building base
  const buildingGeo = new THREE.BoxGeometry(5.5, 4.2, 5.0);
  const buildingMesh = new THREE.Mesh(buildingGeo, wallMat);
  buildingMesh.position.y = 2.1;
  buildingMesh.castShadow = true;
  buildingMesh.receiveShadow = true;
  group.add(buildingMesh);

  // Gabled Roof
  const roofGeo = new THREE.ConeGeometry(4.2, 2.6, 4);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.scale(1.1, 1, 0.95);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.y = 5.2;
  roofMesh.castShadow = true;
  group.add(roofMesh);

  // Stone Chimney
  const chimneyGeo = new THREE.BoxGeometry(0.7, 3.2, 0.7);
  const chimneyMesh = new THREE.Mesh(chimneyGeo, materials.steelDark);
  chimneyMesh.position.set(1.8, 4.8, 1.2);
  chimneyMesh.castShadow = true;
  group.add(chimneyMesh);

  // Warm glowing windows
  const winGeo = new THREE.BoxGeometry(0.8, 0.9, 0.05);
  const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const win1 = new THREE.Mesh(winGeo, winMat);
  win1.position.set(-1.4, 2.6, 2.52);
  group.add(win1);

  const win2 = new THREE.Mesh(winGeo, winMat);
  win2.position.set(1.4, 2.6, 2.52);
  group.add(win2);

  // Wooden tavern door
  const doorGeo = new THREE.BoxGeometry(1.2, 1.9, 0.08);
  const doorMesh = new THREE.Mesh(doorGeo, materials.leather);
  doorMesh.position.set(0, 0.95, 2.52);
  group.add(doorMesh);

  return group;
}

/**
 * Town Environment: Blacksmith Forge
 */
export function createForge3D(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Forge_3D';

  // Open stone forge foundation
  const baseGeo = new THREE.BoxGeometry(5.0, 3.2, 4.0);
  const baseMesh = new THREE.Mesh(baseGeo, materials.steelDark);
  baseMesh.position.y = 1.6;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Lean-to roof
  const roofGeo = new THREE.BoxGeometry(5.6, 0.35, 4.6);
  roofGeo.rotateX(0.15);
  const roofMesh = new THREE.Mesh(roofGeo, materials.wood);
  roofMesh.position.set(0, 3.4, 0);
  roofMesh.castShadow = true;
  group.add(roofMesh);

  // Glowing fiery furnace coals
  const coalsGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 8);
  const coalsMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const coalsMesh = new THREE.Mesh(coalsGeo, coalsMat);
  coalsMesh.position.set(1.2, 0.8, 1.0);
  group.add(coalsMesh);

  // Furnace fire light
  const fireLight = new THREE.PointLight(0xf97316, 2.0, 8);
  fireLight.position.set(1.2, 1.4, 1.0);
  group.add(fireLight);

  // Heavy steel anvil outside
  const anvilGeo = new THREE.BoxGeometry(0.6, 0.55, 0.9);
  const anvilMesh = new THREE.Mesh(anvilGeo, materials.steel);
  anvilMesh.position.set(-1.4, 0.3, 2.4);
  anvilMesh.castShadow = true;
  group.add(anvilMesh);

  return group;
}

/**
 * Town Environment: Medieval Residential House
 */
export function createHouse3D(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'House_3D';

  const wallMat = new THREE.MeshStandardMaterial({
    map: getMedievalWallTexture(),
    roughness: 0.88,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: getRoofTileTexture(),
    roughness: 0.72,
  });
  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x382315,
    roughness: 0.9,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x77766f,
    roughness: 0.96,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffd58a,
    emissive: 0x8b4b16,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });

  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.4, 3.6), wallMat);
  baseMesh.position.y = 1.7;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Dark oak framing gives the plaster walls a readable medieval half-timber structure.
  for (const x of [-1.88, 1.88]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.45, 0.16), timberMat);
    post.position.set(x, 1.72, 1.82);
    post.castShadow = true;
    group.add(post);
  }
  for (const y of [0.28, 3.18]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(4.05, 0.16, 0.18), timberMat);
    beam.position.set(0, y, 1.82);
    beam.castShadow = true;
    group.add(beam);
  }
  for (const x of [-0.92, 0.92]) {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.14), timberMat);
    brace.position.set(x, 2.12, 1.84);
    brace.rotation.z = x < 0 ? -0.42 : 0.42;
    group.add(brace);
  }

  const roofGeo = new THREE.ConeGeometry(3.2, 2.2, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.y = 4.3;
  roofMesh.castShadow = true;
  group.add(roofMesh);

  // Stone chimney with a dark cap.
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.62, 2.15, 0.62), stoneMat);
  chimney.position.set(1.28, 4.45, -0.95);
  chimney.castShadow = true;
  group.add(chimney);
  const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 0.82), timberMat);
  chimneyCap.position.set(1.28, 5.58, -0.95);
  group.add(chimneyCap);

  // Recessed front door, warm windows and timber shutters.
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.9, 0.1), timberMat);
  door.position.set(0, 0.98, 1.86);
  door.castShadow = true;
  group.add(door);
  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.55, 0.035), materials.leather);
  doorPanel.position.set(0, 0.98, 1.925);
  group.add(doorPanel);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), materials.gold);
  handle.position.set(0.28, 1.0, 1.97);
  group.add(handle);

  for (const x of [-1.15, 1.15]) {
    const window = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.82, 0.07), windowMat);
    window.position.set(x, 2.15, 1.86);
    group.add(window);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.98, 0.11), timberMat);
    frame.position.set(x, 2.15, 1.82);
    group.add(frame);
    const inset = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.74, 0.035), windowMat);
    inset.position.set(x, 2.15, 1.89);
    group.add(inset);
    for (const side of [-1, 1]) {
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.78, 0.08), materials.wood);
      shutter.position.set(x + side * 0.42, 2.15, 1.86);
      group.add(shutter);
    }
  }

  // Small stone foundation course.
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(4.12, 0.28, 3.72), stoneMat);
  foundation.position.y = 0.14;
  foundation.receiveShadow = true;
  group.add(foundation);

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

/**
 * Stylized Fantasy Oak Tree
 */
export function createOakTree3D(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Tree_Oak';

  // Twisted wood trunk
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.5, 3.4, 8);
  const trunkMesh = new THREE.Mesh(trunkGeo, materials.wood);
  trunkMesh.position.y = 1.7;
  trunkMesh.castShadow = true;
  group.add(trunkMesh);

  // Volumetric clustered leafy canopy (3 intersecting spheres)
  const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4), materials.leavesOak);
  canopy1.position.set(0, 3.8, 0);
  canopy1.castShadow = true;
  group.add(canopy1);

  const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1), materials.leavesOak);
  canopy2.position.set(-0.6, 3.2, 0.4);
  canopy2.castShadow = true;
  group.add(canopy2);

  const canopy3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15), materials.leavesOak);
  canopy3.position.set(0.6, 3.4, -0.3);
  canopy3.castShadow = true;
  group.add(canopy3);

  return group;
}

/**
 * Stylized Evergreen Pine Tree
 */
export function createPineTree3D(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Tree_Pine';

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.2, 8);
  const trunkMesh = new THREE.Mesh(trunkGeo, materials.wood);
  trunkMesh.position.y = 1.1;
  trunkMesh.castShadow = true;
  group.add(trunkMesh);

  // 3 Tiered foliage cones
  const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.0, 7), materials.leavesPine);
  tier1.position.y = 2.4;
  tier1.castShadow = true;
  group.add(tier1);

  const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.8, 7), materials.leavesPine);
  tier2.position.y = 3.6;
  tier2.castShadow = true;
  group.add(tier2);

  const tier3 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.5, 7), materials.leavesPine);
  tier3.position.y = 4.7;
  tier3.castShadow = true;
  group.add(tier3);

  return group;
}

/**
 * Town Lantern Post with PointLight
 */
export function createLampPost3D(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'LampPost_3D';

  const postGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8);
  const postMesh = new THREE.Mesh(postGeo, materials.steelDark);
  postMesh.position.y = 1.6;
  postMesh.castShadow = true;
  group.add(postMesh);

  // Glass lantern housing
  const lanternGeo = new THREE.BoxGeometry(0.36, 0.5, 0.36);
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const lanternMesh = new THREE.Mesh(lanternGeo, lanternMat);
  lanternMesh.position.y = 3.1;
  group.add(lanternMesh);

  // Warm golden light
  const light = new THREE.PointLight(0xfef08a, 1.2, 9);
  light.position.set(0, 3.1, 0);
  group.add(light);

  return group;
}

/**
 * Mossy Boulder 3D Model
 */
export function createBoulder3D(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Boulder_3D';

  const geo = new THREE.DodecahedronGeometry(0.85);
  geo.scale(1.2, 0.8, 1.0);
  const mesh = new THREE.Mesh(geo, materials.rock);
  mesh.position.y = 0.55;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

/**
 * Town Wall Section
 */
export function createWallSection3D(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'WallSection_3D';

  const wallGeo = new THREE.BoxGeometry(2.0, 2.2, 0.6);
  const wallMesh = new THREE.Mesh(wallGeo, materials.steelDark);
  wallMesh.position.y = 1.1;
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  group.add(wallMesh);

  // Battlements on top
  const batGeo = new THREE.BoxGeometry(0.6, 0.4, 0.65);
  const bat1 = new THREE.Mesh(batGeo, materials.steelDark);
  bat1.position.set(-0.6, 2.4, 0);
  group.add(bat1);

  const bat2 = new THREE.Mesh(batGeo, materials.steelDark);
  bat2.position.set(0.6, 2.4, 0);
  group.add(bat2);

  return group;
}

/**
 * NPC 3D Model (Guard, Alchemist, Blacksmith, Elder)
 */
export function createNPC3D(role: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `NPC_${role}`;

  let robeColor = 0x3b82f6;
  if (role === 'guard') robeColor = 0x64748b;
  if (role === 'alchemist') robeColor = 0x10b981;
  if (role === 'blacksmith') robeColor = 0xb45309;
  if (role === 'elder') robeColor = 0x818cf8;

  const robeMat = new THREE.MeshStandardMaterial({
    color: robeColor,
    roughness: 0.7,
  });

  // Body
  const bodyGeo = new THREE.CylinderGeometry(0.24, 0.35, 1.3, 8);
  const bodyMesh = new THREE.Mesh(bodyGeo, robeMat);
  bodyMesh.position.y = 0.85;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Head
  const headGeo = new THREE.SphereGeometry(0.18, 10, 10);
  const headMesh = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 }));
  headMesh.position.y = 1.65;
  headMesh.castShadow = true;
  group.add(headMesh);

  // Role accessories
  if (role === 'elder') {
    // Wizard hat
    const hatGeo = new THREE.ConeGeometry(0.35, 0.8, 8);
    const hatMesh = new THREE.Mesh(hatGeo, robeMat);
    hatMesh.position.y = 2.15;
    group.add(hatMesh);

    // Glowing staff
    const staffGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6);
    const staffMesh = new THREE.Mesh(staffGeo, materials.wood);
    staffMesh.position.set(0.4, 1.0, 0.2);
    group.add(staffMesh);

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), materials.glowBlue);
    orb.position.set(0.4, 2.0, 0.2);
    group.add(orb);
  } else if (role === 'guard') {
    // Guard helmet & spear
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), materials.steel);
    helm.position.y = 1.68;
    group.add(helm);

    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), materials.wood);
    spear.position.set(0.35, 1.2, 0.2);
    group.add(spear);

    const spearTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), materials.steel);
    spearTip.position.set(0.35, 2.45, 0.2);
    group.add(spearTip);
  }

  return group;
}
