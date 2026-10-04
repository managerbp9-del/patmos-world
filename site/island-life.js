import * as THREE from 'three';

// All authored dimensions below are metres. Geographic coordinates and sampled
// ground heights are world units; a single uniform scale joins the two systems.
export const LIFE_DIMENSIONS = Object.freeze({
  humanHeight: 1.75,
  houseWidth: [4.6, 6.2],
  houseHeight: [2.55, 2.85],
  pierLength: 15,
  oliveHeight: [2.4, 4.6],
  caveWidth: 6.4,
  petraFootprint: [30, 49],
});

const TAU = Math.PI * 2;
const random = (a, b = 0) => {
  const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
  return value - Math.floor(value);
};
const clamp = THREE.MathUtils.clamp;
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitBall = new THREE.SphereGeometry(1, 12, 8);
const unitPole = new THREE.CylinderGeometry(.72, 1, 1, 7);
const up = new THREE.Vector3(0, 1, 0);

function material(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .97, ...extra });
}

function mesh(parent, geometry, mat, position, scale, rotation) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(...position);
  if (scale) object.scale.set(...scale);
  if (rotation) object.rotation.set(...rotation);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function box(parent, mat, position, scale, rotation) {
  return mesh(parent, unitBox, mat, position, scale, rotation);
}

function limb(parent, mat, start, end, radius) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const object = mesh(parent, unitPole, mat, a.clone().add(b).multiplyScalar(.5).toArray(), [radius, a.distanceTo(b), radius]);
  object.quaternion.setFromUnitVectors(up, b.sub(a).normalize());
  return object;
}

// A smooth, uneven silhouette without cone leaves or perfectly spherical crowns.
function weatheredGeometry(seed, widthSegments = 18, heightSegments = 12) {
  const geometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const r = 1 + .075 * Math.sin(x * 5.1 + z * 3.8 + seed) * Math.cos(y * 5.7 - seed)
      + .035 * Math.sin(x * 10.7 - z * 6.3 + y * 7.1);
    p.setXYZ(i, x * r + .035 * Math.sin(y * 4 + seed), y * r, z * r);
  }
  geometry.computeVertexNormals();
  return geometry;
}

const rockGeometry = weatheredGeometry(1.2);
const leafGeometry = weatheredGeometry(4.1, 12, 8);

/** A restrained adult silhouette, exactly 1.75 m tall before uniform scaling. */
export function createWalker({ color = '#555e69', scale = .035, scarf = '#9a8466' } = {}) {
  const root = new THREE.Group();
  root.name = 'traveler';
  root.scale.setScalar(scale);
  const body = new THREE.Group();
  root.add(body);
  const cloth = material(color), hem = material(color).clone();
  hem.color.multiplyScalar(.84);
  const skin = material('#aa927e'), boots = material('#363530');
  const hair = material('#373a37'), sash = material(scarf);
  const hips = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * .095, .82, 0);
    body.add(leg);
    limb(leg, hem, [0, -.03, 0], [0, -.39, .008], .072);
    limb(leg, hem, [0, -.38, .008], [0, -.73, 0], .059);
    mesh(leg, unitBall, boots, [0, -.755, .043], [.068, .064, .132]);
    hips.push(leg);
  }
  // The long tunic remains narrower than the shoulders; the legs stay legible.
  const coat = mesh(body, new THREE.CylinderGeometry(.213, .255, .74, 12, 1), cloth, [0, 1.08, 0], [1, 1, .66]);
  mesh(body, unitBall, cloth, [0, 1.335, -.006], [.232, .132, .145]);
  mesh(body, new THREE.CylinderGeometry(.214, .216, .035, 12), sash, [0, 1.05, .002], [1, 1, .67]);
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * .226, 1.34, 0);
    arm.rotation.z = side * .08;
    body.add(arm);
    limb(arm, cloth, [0, 0, 0], [side * .021, -.28, .012], .069);
    limb(arm, cloth, [side * .021, -.26, .012], [side * .01, -.46, .025], .051);
    mesh(arm, unitBall, skin, [side * .01, -.489, .025], [.041, .065, .041]);
    arms.push(arm);
  }
  limb(body, skin, [0, 1.41, 0], [0, 1.54, 0], .059);
  mesh(body, unitBall, skin, [0, 1.604, .015], [.097, .123, .094]);
  mesh(body, unitBall, hair, [0, 1.663, -.019], [.101, .087, .093]);
  mesh(body, unitBall, skin, [0, 1.595, .104], [.022, .032, .032]);
  const shawl = mesh(body, new THREE.CylinderGeometry(.213, .246, .49, 12, 1, true, Math.PI * .45, Math.PI * 1.1), sash, [0, 1.193, -.008], [1, 1, .77]);
  root.userData.heightMetres = 1.75;
  return {
    root,
    body,
    update(time, moving = false) {
      const amount = typeof moving === 'number' ? clamp(moving, 0, 1) : moving ? 1 : 0;
      const stride = Math.sin(time * 6.9) * .36 * amount;
      hips[0].rotation.x = stride;
      hips[1].rotation.x = -stride;
      arms[0].rotation.x = -stride * .62;
      arms[1].rotation.x = stride * .62;
      body.position.y = Math.abs(Math.sin(time * 6.9)) * .019 * amount;
      coat.rotation.z = Math.sin(time * 3.45) * .012 * amount;
      shawl.rotation.x = .024 + Math.sin(time * 1.8) * .025 + amount * .055;
    },
  };
}

export function createIslandLife({ scene, ground, places = [], SCALE = .035 }) {
  const S = SCALE;
  const root = new THREE.Group();
  root.name = 'island-life';
  scene.add(root);
  const obstacles = [], interactables = [], walkSurfaces = [], boats = [], people = [];
  const placePositions = {};
  const palette = {
    stone: material('#85847b'), paleStone: material('#a4a095'), darkStone: material('#626861'),
    plaster: material('#a7a497'), plasterShade: material('#94988d'),
    roof: material('#777b70'), earth: material('#827f6d', { transparent: true, opacity: .48, depthWrite: false, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    wood: material('#60584c'), darkWood: material('#3f4945'),
    recess: material('#252e2d'), iron: material('#51574f'),
    ceramic: material('#8b7160'), linen: material('#a2a48d'),
    leaf: material('#576656'), leafLight: material('#6f7864'), leafDark: material('#47594e'),
    glow: material('#d0a26b', { emissive: '#e6ae61', emissiveIntensity: .7 }),
  };
  const byId = Object.fromEntries(places.map(p => [p.id, p]));
  const defaults = {
    landing: { x: -81.878, z: 3.715 }, cave: { x: -81.134, z: 40.051 },
    petra: { x: -26.527, z: 108.321 }, north: { x: -6.004, z: -103.379 },
    olive: { x: -88, z: 24 }, garden: { x: -40, z: 94 }, ridge: { x: -96.103, z: 94.364 },
  };
  const sample = (x, z) => {
    const g = ground(x, z);
    return g && Number.isFinite(g.height) ? { height: g.height, slope: g.slope ?? g.normalY ?? 1 } : null;
  };
  const land = (x, z, minimum = .25 * S) => {
    const g = sample(x, z);
    return g && g.height > minimum && g.slope > .72 ? g : null;
  };
  const at = (id) => byId[id] || defaults[id];

  function findLand(x, z, { radius = 3 * S, min = .5 * S, max = 6, slope = .78 } = {}) {
    let best = null;
    for (let r = 0; r <= max; r += 2 * S) {
      const count = r ? Math.max(12, Math.ceil(r / S) * 2) : 1;
      for (let i = 0; i < count; i++) {
        const angle = i / count * TAU, nx = x + Math.sin(angle) * r, nz = z + Math.cos(angle) * r;
        const samples = [[0, 0], [-radius, 0], [radius, 0], [0, -radius], [0, radius]].map(([dx, dz]) => sample(nx + dx, nz + dz));
        if (samples.some(g => !g || g.height <= min || g.slope < slope)) continue;
        const h = samples[0].height;
        const score = r + (Math.max(...samples.map(g => g.height)) - Math.min(...samples.map(g => g.height))) * .9;
        if (!best || score < best.score) best = { x: nx, y: h, z: nz, score };
      }
      if (best && r > best.score + S * 3) break;
    }
    return best ? new THREE.Vector3(best.x, best.y, best.z) : null;
  }

  function anchor(id, position) {
    placePositions[id] = position.clone();
    if (byId[id]) {
      byId[id].x = position.x;
      byId[id].z = position.z;
      byId[id].point = position.clone();
    }
  }

  function groupAt(x, z, yaw = 0, y) {
    const group = new THREE.Group();
    group.position.set(x, y ?? sample(x, z)?.height ?? 0, z);
    group.rotation.y = yaw;
    group.scale.setScalar(S);
    root.add(group);
    return group;
  }

  function worldOffset(position, yaw, x, z) {
    return new THREE.Vector3(position.x + (x * Math.cos(yaw) + z * Math.sin(yaw)) * S, 0,
      position.z + (-x * Math.sin(yaw) + z * Math.cos(yaw)) * S);
  }

  function observe(object, title, kind, text, position) {
    const point = position.clone();
    point.y = sample(point.x, point.z)?.height ?? point.y;
    const entry = { object, title, kind, text, position: point };
    object.userData.interactable = entry;
    interactables.push(entry);
    return entry;
  }

  function batchStaticGroup(group) {
    // Preserve each landmark's clickable group and each boat's animated parent,
    // while submitting its repeated planks, stone blocks and twigs together.
    group.updateWorldMatrix(true, true);
    const inverse = group.matrixWorld.clone().invert(), batches = new Map();
    group.traverse(object => {
      if (!object.isMesh || object.isInstancedMesh || Array.isArray(object.material) || object.userData.interactable) return;
      const key = object.geometry.uuid + ':' + object.material.uuid + ':' + object.castShadow + ':' + object.receiveShadow;
      if (!batches.has(key)) batches.set(key, []);
      batches.get(key).push({ object, matrix: new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld) });
    });
    for (const entries of batches.values()) {
      if (entries.length < 3) continue;
      const original = entries[0].object;
      const batch = new THREE.InstancedMesh(original.geometry, original.material, entries.length);
      batch.castShadow = original.castShadow; batch.receiveShadow = original.receiveShadow;
      for (let i = 0; i < entries.length; i++) {
        batch.setMatrixAt(i, entries[i].matrix);
        entries[i].object.removeFromParent();
      }
      batch.instanceMatrix.needsUpdate = true;
      batch.computeBoundingSphere();
      group.add(batch);
    }
  }

  function rock(parent, mat, position, scale, seed = 0) {
    return mesh(parent, rockGeometry, mat, position, scale, [random(seed, 8) * .14, random(seed, 9) * TAU, random(seed, 10) * .12]);
  }

  // Small objects are composed in metre-local groups; no enlarged scenic bases.
  function jug(parent, x, z, size = 1) {
    mesh(parent, unitBall, palette.ceramic, [x, .28 * size, z], [.18 * size, .27 * size, .18 * size]);
    mesh(parent, new THREE.CylinderGeometry(.065, .09, .14, 10), palette.ceramic, [x, .55 * size, z], [size, size, size]);
    mesh(parent, new THREE.CylinderGeometry(.053, .053, .008, 10), palette.recess, [x, .623 * size, z], [size, size, size]);
    const handle = mesh(parent, new THREE.TorusGeometry(.106, .027, 5, 10, Math.PI * 1.6), palette.ceramic, [x + .165 * size, .39 * size, z], [size, size, size]);
    handle.rotation.z = -.65;
  }

  function basket(parent, x, z, size = 1) {
    mesh(parent, new THREE.CylinderGeometry(.29, .22, .39, 12, 1, true), palette.linen, [x, .22 * size, z], [size, size, size]);
    mesh(parent, new THREE.CylinderGeometry(.265, .265, .01, 12), palette.darkWood, [x, .385 * size, z], [size, size, size]);
    for (let i = 0; i < 5; i++) {
      const ring = mesh(parent, new THREE.TorusGeometry(.224 + i * .015, .012, 4, 16), palette.wood,
        [x, (.045 + i * .087) * size, z], [size, size, size]);
      ring.rotation.x = Math.PI / 2;
    }
    for (let i = 0; i < 10; i++) {
      const angle = i / 10 * TAU;
      limb(parent, palette.wood, [x + Math.sin(angle) * .22 * size, .045 * size, z + Math.cos(angle) * .22 * size],
        [x + Math.sin(angle) * .29 * size, .41 * size, z + Math.cos(angle) * .29 * size], .009 * size);
    }
  }

  function masonry(parent, width, depth, height, index, doorX) {
    const data = [[], [], []], matrix = new THREE.Matrix4(), q = new THREE.Quaternion();
    const mats = [palette.stone, palette.paleStone, palette.darkStone];
    const push = (position, size, yaw, variant) => {
      q.setFromEuler(new THREE.Euler(0, yaw, 0));
      data[variant].push(matrix.compose(new THREE.Vector3(...position), q, new THREE.Vector3(...size)).clone());
    };
    for (let faceIndex = 0; faceIndex < 4; faceIndex++) {
      const front = faceIndex === 0, rear = faceIndex === 2;
      const sideWidth = front || rear ? width : depth;
      const faceDepth = front || rear ? depth : width;
      const yaw = faceIndex * Math.PI / 2;
      for (let row = 0; row < 9; row++) {
        const y = .13 + row * .275, seed = index * 113 + row * 29 + faceIndex * 17;
        const count = Math.ceil(sideWidth / .6);
        for (let column = 0; column < count; column++) {
          const x = -sideWidth / 2 + .28 + column * .59 + (row % 2) * .2;
          if (x > sideWidth / 2 - .17 || front && Math.abs(x - doorX) < .64 && y < 2.2) continue;
          const corner = Math.abs(x) > sideWidth / 2 - .65;
          if (y > 1.02 && !corner && random(column, seed) > (rear ? .21 : .15)) continue;
          const z = faceDepth / 2 + .026;
          push([x * Math.cos(yaw) + z * Math.sin(yaw), y, -x * Math.sin(yaw) + z * Math.cos(yaw)],
            [.49 + random(column, seed + 1) * .08, .22 + random(column, seed + 2) * .02, .075], yaw,
            random(column, seed + 3) < .12 ? 2 : random(column, seed + 4) < .33 ? 1 : 0);
        }
      }
    }
    for (let i = 0; i < data.length; i++) {
      const stones = new THREE.InstancedMesh(unitBox, mats[i], data[i].length);
      data[i].forEach((m, j) => stones.setMatrixAt(j, m));
      stones.castShadow = stones.receiveShadow = true;
      parent.add(stones);
    }
  }

  function awning(parent, doorX, face, width = 2.3) {
    const left = doorX - width / 2, right = doorX + width / 2, front = face + 1.45;
    for (const x of [left, right]) {
      limb(parent, palette.darkWood, [x, 0, front], [x + .035, 2.09, front - .04], .045);
      limb(parent, palette.wood, [x, 2.32, face], [x, 2.09, front], .05);
    }
    limb(parent, palette.wood, [left - .14, 2.07, front], [right + .13, 2.07, front], .057);
    const cloth = new THREE.PlaneGeometry(width + .2, 1.53, 8, 5), p = cloth.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), along = p.getY(i) / 1.53 + .5;
      p.setXYZ(i, x + doorX, 2.33 - along * .27 - Math.sin(along * Math.PI) * .09 - Math.cos(x * 5) * .025,
        face + along * 1.53);
    }
    cloth.computeVertexNormals();
    mesh(parent, cloth, material('#858774', { side: THREE.DoubleSide }), [0, 0, 0]);
  }

  function cottage(x, z, yaw, index) {
    const width = [5.6, 4.6, 6.2, 4.8][index], depth = [4.2, 3.8, 4.5, 3.6][index];
    const height = [2.7, 2.55, 2.85, 2.6][index];
    const origin = new THREE.Vector3(x, 0, z);
    const corners = [[-width / 2, -depth / 2], [width / 2, -depth / 2], [-width / 2, depth / 2], [width / 2, depth / 2]]
      .map(([dx, dz]) => worldOffset(origin, yaw, dx, dz)).map(p => sample(p.x, p.z));
    if (corners.some(g => !g || g.height < .18 * S)) return null;
    const low = Math.min(...corners.map(g => g.height)), high = Math.max(...corners.map(g => g.height));
    if (high - low > 1.1 * S) return null;
    const g = groupAt(x, z, yaw, high);
    g.name = 'stone-cottage';
    const foundation = (high - low) / S + .2;
    box(g, palette.darkStone, [0, -foundation / 2, 0], [width, foundation, depth]);
    box(g, index % 2 ? palette.plasterShade : palette.plaster, [0, height / 2, 0], [width, height, depth]);
    const roof = new THREE.BoxGeometry(width + .2, .17, depth + .23, 10, 1, 8), rp = roof.attributes.position;
    for (let i = 0; i < rp.count; i++) rp.setY(i, rp.getY(i) + Math.sin(rp.getX(i) * 2.9 + index) * .023 + Math.cos(rp.getZ(i) * 3.7) * .015);
    roof.computeVertexNormals();
    mesh(g, roof, palette.roof, [0, height + .055, 0]);
    box(g, palette.stone, [0, height + .19, -depth / 2 + .08], [width + .15, .19, .22]);
    box(g, palette.stone, [-width / 2 + .055, height + .17, 0], [.21, .16, depth]);
    box(g, palette.stone, [width / 2 - .055, height + .17, 0], [.21, .16, depth]);
    const face = depth / 2 + .011, doorX = index % 2 ? -.65 : .55;
    masonry(g, width, depth, height, index, doorX);
    for (const dx of [-width * .33, 0, width * .33]) {
      box(g, palette.darkWood, [dx, height - .09, 0], [.13, .14, depth + .52]);
      box(g, palette.wood, [dx, height - .095, depth / 2 + .272], [.12, .13, .018]);
    }
    box(g, palette.recess, [doorX, .97, face], [.83, 1.94, .025]);
    box(g, palette.darkWood, [doorX + .025, .93, face + .018], [.7, 1.8, .045]);
    for (let i = 0; i < 4; i++) box(g, palette.wood, [doorX - .23 + i * .152, .94, face + .045], [.014, 1.76, .014]);
    for (const side of [-1, 1]) box(g, palette.paleStone, [doorX + side * .495, .99, face + .04], [.16, 1.98, .19]);
    box(g, palette.paleStone, [doorX, 2.06, face + .035], [1.16, .23, .24], [0, 0, -.025]);
    box(g, palette.stone, [doorX, .035, face + .28], [1.14, .12, .64]);
    const windowX = doorX > 0 ? -1.4 : 1.1;
    box(g, palette.recess, [windowX, 1.56, face + .005], [.57, .72, .04]);
    box(g, index === 1 ? palette.glow : palette.darkWood, [windowX, 1.54, face + .035], [.39, .55, .025]);
    box(g, palette.wood, [windowX, 1.55, face + .055], [.048, .6, .035]);
    box(g, palette.paleStone, [windowX, 1.15, face + .07], [.73, .11, .23]);
    for (const side of [-1, 1]) {
      const shutter = new THREE.Group();
      shutter.position.set(windowX + side * .35, 1.55, face + .1);
      shutter.rotation.y = side * -.27;
      g.add(shutter);
      box(shutter, palette.darkWood, [side * .15, 0, 0], [.29, .66, .045]);
      for (const x of [.06, .15, .24]) box(shutter, palette.wood, [side * x, 0, .025], [.014, .61, .014]);
      for (const y of [-.19, .19]) box(shutter, palette.wood, [side * .15, y, .035], [.29, .04, .025]);
    }
    // A second, shaded side window gives the oblique view a recognisable facade.
    const side = index % 2 ? -1 : 1, wx = side * (width / 2 + .018);
    box(g, palette.recess, [wx, 1.53, -.42], [.035, .65, .56]);
    box(g, index === 2 ? palette.glow : palette.darkWood, [wx + side * .025, 1.53, -.42], [.027, .47, .38]);
    box(g, palette.paleStone, [wx + side * .035, 1.15, -.42], [.19, .12, .72]);
    box(g, palette.wood, [wx + side * .043, 1.53, -.42], [.025, .5, .04]);
    // Exposed rubble is concentrated at the bottom and corners, with calm plaster above.
    for (let row = 0; row < 3; row++) {
      const count = Math.floor(width / .65);
      for (let i = 0; i < count; i++) {
        const bx = -width / 2 + .36 + i * (width - .7) / Math.max(1, count - 1) + (row % 2) * .13;
        if (Math.abs(bx - doorX) < .62 || random(i + index * 20, row) > .64) continue;
        rock(g, (i + row) % 3 ? palette.stone : palette.paleStone,
          [bx, .18 + row * .23, face + .015], [.27 + random(i, row) * .07, .115, .07], i + row * 10);
      }
    }
    for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
      box(g, i % 3 ? palette.stone : palette.paleStone,
        [side * (width / 2 - .04), .21 + i * .39, face + .025], [.34, .28 + random(i, index) * .05, .15]);
    }
    jug(g, -width / 2 - .23, depth / 2 - .4, .9);
    basket(g, width / 2 + .32, depth / 2 - .4, .85);
    if (index === 0 || index === 2) awning(g, doorX, face, index === 0 ? 2.3 : 1.85);
    if (index === 1 || index === 3) {
      const cornerX = -width / 2 - .08;
      limb(g, palette.darkWood, [cornerX, 0, face], [cornerX - .04, 2.45, face + .12], .028);
      limb(g, palette.darkWood, [cornerX, 1.4, face + .03], [cornerX + 1.1, 2.5, face + .02], .017);
      for (let i = 0; i < 16; i++) {
        const angle = random(i, index + 50) * TAU;
        mesh(g, leafGeometry, i % 3 ? palette.leafDark : palette.leaf,
          [cornerX + .16 + Math.sin(i * .5) * .23 + Math.max(0, i - 10) * .12, .37 + i * .138, face + .06 + Math.cos(angle) * .09],
          [.19 + random(i, 54) * .07, .12, .095], [0, angle, .15]);
      }
    }
    if (index === 0 || index === 2) {
      box(g, palette.darkWood, [doorX + .7, 1.82, face + .16], [.17, .31, .14]);
      box(g, palette.glow, [doorX + .7, 1.81, face + .235], [.085, .17, .014]);
    }
    const doorway = worldOffset(g.position, yaw, doorX, depth / 2 + 1.15);
    doorway.y = sample(doorway.x, doorway.z)?.height ?? high;
    obstacles.push({ x, z, r: Math.hypot(width, depth) * .47 * S });
    observe(g, index === 0 ? '문가의 작은 등불' : '돌집의 낮은 창', 'house',
      index === 0 ? '문가에 작은 빛이 남아 있습니다. 바닷바람이 잠잠해질 때까지 잠시 머뭅니다.' : '두꺼운 벽과 낮은 문. 섬의 하루가 조용히 이어집니다.', doorway);
    return { group: g, doorway };
  }

  function trail(points, width = .85) {
    const vertices = [], colors = [];
    for (let segment = 0; segment < points.length - 1; segment++) {
      const a = points[segment], b = points[segment + 1];
      const distance = Math.hypot(b.x - a.x, b.z - a.z), steps = Math.max(2, Math.ceil(distance / (S * .65)));
      const nx = -(b.z - a.z) / distance, nz = (b.x - a.x) / distance;
      if (!Number.isFinite(nx)) continue;
      let previous = null;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const curve = Math.sin(t * Math.PI) * Math.min(distance * .09, 1.2 * S) + Math.sin(t * TAU) * .11 * S;
        const x = THREE.MathUtils.lerp(a.x, b.x, t) + nx * curve, z = THREE.MathUtils.lerp(a.z, b.z, t) + nz * curve;
        const half = width * S * (.42 + random(i, segment + 30) * .18);
        const side = [-1, -.62, .62, 1].map(sign => {
          const sx = x + nx * half * sign, sz = z + nz * half * sign, g = sample(sx, sz);
          return g && g.height > .005 ? [sx, g.height + .0006, sz] : null;
        });
        if (side.some(p => !p)) { previous = null; continue; }
        if (previous) {
          for (let strip = 0; strip < 3; strip++) {
            const triangles = [[previous[strip], strip], [previous[strip + 1], strip + 1], [side[strip], strip],
              [side[strip], strip], [previous[strip + 1], strip + 1], [side[strip + 1], strip + 1]];
            for (const [p, lane] of triangles) { vertices.push(...p); colors.push(1, 1, 1, lane === 0 || lane === 3 ? 0 : .78 + random(i, 68) * .16); }
          }
        }
        previous = side;
      }
    }
    if (!vertices.length) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    geometry.computeVertexNormals();
    const object = mesh(root, geometry, palette.earth, [0, 0, 0]);
    object.castShadow = false;
  }

  // Locate a compact, usable harbor on the original Skala coast.
  const requestedHarbor = at('landing');
  const harborLand = findLand(requestedHarbor.x, requestedHarbor.z, { radius: 2.5 * S, min: .8 * S, max: 8 })
    || findLand(defaults.landing.x, defaults.landing.z, { radius: S, max: 12 });
  let spawn = harborLand || new THREE.Vector3(defaults.landing.x - 1, .05, defaults.landing.z + .5);
  let seaward = new THREE.Vector3(0, 0, -1);
  let shorePoint = spawn.clone();
  if (harborLand) {
    let closest = Infinity;
    for (let i = 0; i < 72; i++) {
      const angle = i / 72 * TAU, direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      for (let d = .02; d < 4; d += .02) {
        const p = harborLand.clone().addScaledVector(direction, d), g = sample(p.x, p.z);
        if (!g || g.height < .006) {
          if (d < closest) { closest = d; seaward = direction; shorePoint = p; }
          break;
        }
      }
    }
    // Stand nine metres behind the waterline, leaving a clear path to the pier.
    const preferred = shorePoint.clone().addScaledVector(seaward, -9 * S);
    spawn = findLand(preferred.x, preferred.z, { radius: .8 * S, min: .35 * S, max: .4 }) || harborLand;
  }
  anchor('landing', spawn);
  const harborYaw = Math.atan2(seaward.x, seaward.z);
  const houseSlots = [[-8, -3], [1, -9], [12, -5], [-16, -13]];
  let houseCount = 0;
  for (let i = 0; i < houseSlots.length; i++) {
    const position = worldOffset(spawn, harborYaw, ...houseSlots[i]);
    const p = findLand(position.x, position.z, { radius: 3.7 * S, min: .25 * S, max: .3, slope: .8 });
    if (!p || obstacles.some(o => Math.hypot(o.x - p.x, o.z - p.z) < o.r + 4 * S)) continue;
    const house = cottage(p.x, p.z, harborYaw + (i % 2 ? -.035 : .045), i);
    if (house) { houseCount++; trail([spawn, house.doorway], .9); }
  }

  const pierStart = shorePoint.clone().addScaledVector(seaward, -.7 * S);
  const deckHeight = Math.max(.75 * S, (sample(pierStart.x, pierStart.z)?.height || 0) + .18 * S);
  const pier = groupAt(pierStart.x, pierStart.z, harborYaw, deckHeight);
  pier.name = 'fishing-pier';
  for (let i = 2; i < 38; i++) {
    const plank = box(pier, i % 5 === 0 ? palette.darkWood : palette.wood,
      [0, -.07 + random(i, 19) * .017, (i + .5) * 15 / 38], [1.85, .15, 15 / 38 - .024]);
    plank.rotation.y = (random(i, 20) - .5) * .014;
  }
  for (const side of [-1, 1]) {
    box(pier, palette.darkWood, [side * .7, -.24, 7.5], [.18, .23, 15.15]);
    for (let i = 0; i < 5; i++) {
      const z = .5 + i * 3.45;
      limb(pier, palette.darkWood, [side * .84, -deckHeight / S - 1.1, z], [side * .84, .18, z], .105);
      if (i === 0 || i === 4) limb(pier, palette.wood, [side * .8, .02, z], [side * .8, .55, z], .08);
    }
  }
  const mooring = mesh(pier, new THREE.TorusGeometry(.24, .026, 5, 18), palette.linen, [.38, .035, 11.2], [1, 1, 1]);
  mooring.rotation.x = Math.PI / 2;
  const pierCenter = worldOffset(pierStart, harborYaw, 0, 7.5);
  const fixedDeckCenter = worldOffset(pierStart, harborYaw, 0, 8);
  walkSurfaces.push({ type: 'box', x: fixedDeckCenter.x, z: fixedDeckCenter.z, y: deckHeight + .005 * S,
    width: 1.85 * S, depth: 14 * S, rotation: harborYaw });
  const rampStart = worldOffset(pierStart, harborYaw, 0, -4), rampEnd = worldOffset(pierStart, harborYaw, 0, 1);
  rampStart.y = sample(rampStart.x, rampStart.z)?.height ?? deckHeight;
  rampEnd.y = deckHeight + .005 * S;
  const rampRise = (rampEnd.y - rampStart.y) / S;
  const rampAngle = -Math.atan2(rampRise, 5);
  const rampBase = (rampStart.y - deckHeight) / S;
  for (let i = 0; i < 14; i++) {
    const t = (i + .5) / 14;
    box(pier, i % 4 ? palette.wood : palette.darkWood,
      [0, rampBase + rampRise * t - .045, -4 + t * 5], [1.85, .09, 5 / 14 - .014], [rampAngle, 0, 0]);
  }
  for (const side of [-1, 1]) {
    limb(pier, palette.darkWood, [side * .69, rampBase - .1, -4], [side * .69, -.09, 1], .07);
  }
  walkSurfaces.push({ type: 'ramp', start: { x: rampStart.x, y: rampStart.y, z: rampStart.z },
    end: { x: rampEnd.x, y: rampEnd.y, z: rampEnd.z }, width: 1.85 * S, rotation: harborYaw });
  const pierEntry = worldOffset(pierStart, harborYaw, 0, -1.7);
  observe(pier, '항구의 계류줄', 'harbor', '밧줄이 느슨해졌다 팽팽해집니다. 작은 목선 너머로 섬의 해안이 이어집니다.', pierEntry);
  trail([spawn, pierEntry], 1.1);

  function fishingBoat(position, yaw, index) {
    const g = groupAt(position.x, position.z, yaw, .08 * S);
    g.name = 'small-fishing-boat';
    // Open hull: a curved shell with narrow gunwales, a dark interior and thwarts.
    const geometry = new THREE.BufferGeometry(), vertices = [];
    const stations = 13;
    for (let i = 0; i < stations - 1; i++) {
      const z0 = -2.5 + i * 5 / (stations - 1), z1 = -2.5 + (i + 1) * 5 / (stations - 1);
      const widthAt = z => .72 * Math.sin(Math.PI * (z + 2.5) / 5) ** .64 + .018;
      const w0 = widthAt(z0), w1 = widthAt(z1);
      for (const side of [-1, 1]) {
        const a = [side * w0 * .27, -.18, z0], b = [side * w1 * .27, -.18, z1];
        const c = [side * w0, .32 + .1 * Math.abs(z0 / 2.5), z0], d = [side * w1, .32 + .1 * Math.abs(z1 / 2.5), z1];
        for (const p of [a, b, c, c, b, d]) vertices.push(...p);
        limb(g, palette.darkWood, c, d, .039);
      }
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    const hullMat = palette.wood.clone(); hullMat.side = THREE.DoubleSide;
    mesh(g, geometry, hullMat, [0, 0, 0]);
    mesh(g, unitBall, palette.recess, [0, -.05, 0], [.48, .07, 2.35]);
    for (const z of [-1.15, 0, 1.15]) box(g, palette.wood, [0, .27, z], [1.12, .08, .23]);
    limb(g, palette.linen, [-.33, .33, -.7], [.42, .34, 1.8], .032);
    box(g, palette.darkWood, [.4, .345, 1.5], [.11, .04, .62], [0, -.3, 0]);
    if (index === 1) {
      limb(g, palette.wood, [0, .05, -.45], [0, 3.5, -.45], .044);
      limb(g, palette.wood, [0, 2.9, -.45], [.72, 3.2, -.45], .028);
      const sail = new THREE.Shape(); sail.moveTo(.03, .6); sail.lineTo(.08, 3.1); sail.lineTo(.45, 2.97); sail.lineTo(.35, .7); sail.closePath();
      mesh(g, new THREE.ShapeGeometry(sail), material('#a7a18a', { side: THREE.DoubleSide }), [0, 0, -.45]);
    }
    boats.push({ object: g, y: g.position.y, phase: index * 2.1 });
    return g;
  }

  for (const [i, dx, dz] of [[0, -3.2, 8.1], [1, 3.4, 11.4], [2, -5.8, 16.5]]) {
    let p = worldOffset(pierStart, harborYaw, dx, dz);
    // Check the complete 5 m hull footprint, not just its centre.
    const fits = test => [[0, 0], [0, 2.6], [0, -2.6], [.8, 0], [-.8, 0]].every(([x, z]) => {
      const q = worldOffset(test, harborYaw, x, z), g = sample(q.x, q.z);
      return !g || g.height < -.003;
    });
    for (let step = 0; !fits(p) && step < 30; step++) p.addScaledVector(seaward, S);
    if (fits(p)) fishingBoat(p, harborYaw + .11 * (i - 1), i);
  }

  // Recessed rock opening on the hillside; its approach remains the original terrain.
  const requestedCave = at('cave');
  const cavePoint = findLand(requestedCave.x, requestedCave.z, { radius: 0, min: S, max: 2, slope: .72 });
  if (cavePoint) {
    const step = 2 * S;
    const hx = (sample(cavePoint.x + step, cavePoint.z)?.height ?? cavePoint.y) - (sample(cavePoint.x - step, cavePoint.z)?.height ?? cavePoint.y);
    const hz = (sample(cavePoint.x, cavePoint.z + step)?.height ?? cavePoint.y) - (sample(cavePoint.x, cavePoint.z - step)?.height ?? cavePoint.y);
    const yaw = Math.atan2(-hx, -hz), g = groupAt(cavePoint.x, cavePoint.z, yaw, cavePoint.y - .15 * S);
    g.name = 'hillside-recess';
    const darkOpening = new THREE.Shape();
    darkOpening.moveTo(-1.22, 0); darkOpening.lineTo(-1.35, 1.22); darkOpening.lineTo(-.81, 2.18);
    darkOpening.lineTo(.12, 2.35); darkOpening.lineTo(1.04, 1.84); darkOpening.lineTo(1.25, .61); darkOpening.lineTo(1.12, 0); darkOpening.closePath();
    mesh(g, new THREE.ShapeGeometry(darkOpening), palette.recess, [0, 0, -.19]);
    rock(g, palette.stone, [-2.03, 1.18, -.45], [1.22, 1.6, 1.72], 41);
    rock(g, palette.darkStone, [1.99, 1.18, -.8], [1.18, 1.65, 1.88], 43);
    rock(g, palette.stone, [-.33, 2.68, -.8], [2.08, .85, 1.78], 42);
    rock(g, palette.paleStone, [1.45, 2.75, -1.39], [1.19, .61, 1.31], 44);
    rock(g, palette.stone, [-2.35, .31, 1.04], [.88, .49, .76], 45);
    rock(g, palette.darkStone, [2.25, .32, .82], [.71, .48, .83], 46);
    const approach = worldOffset(cavePoint, yaw, 0, 4.8);
    approach.y = sample(approach.x, approach.z)?.height ?? cavePoint.y;
    anchor('cave', approach);
    observe(g, '바위 그늘의 동굴', 'cave', '빛이 닿지 않는 바위 안쪽. 바깥의 바람과 발걸음 소리가 조금 멀어집니다.', approach);
    for (const [x, z, radius] of [[-2.1, -.5, 1.1], [2.1, -.7, 1.1], [0, -1.8, 1.5]]) {
      const p = worldOffset(cavePoint, yaw, x, z); obstacles.push({ x: p.x, z: p.z, r: radius * S });
    }
  }

  const petra = at('petra'), petraGround = sample(petra.x, petra.z);
  const petraGroup = groupAt(petra.x, petra.z, -.22, Math.max(-.05, petraGround?.height ?? 0) - .3 * S);
  petraGroup.name = 'coastal-outcrop';
  rock(petraGroup, palette.stone, [-.8, 7.1, .6], [11.7, 10, 18.3], 72);
  rock(petraGroup, palette.paleStone, [-1.7, 10.1, -2.5], [9.6, 8.8, 13.5], 73);
  rock(petraGroup, palette.stone, [6.1, 3.8, 10.8], [8.4, 5.2, 12.7], 74);
  rock(petraGroup, palette.darkStone, [-5.7, 1.1, -15.1], [7.2, 2.9, 9.7], 75);
  for (let i = 0; i < 13; i++) {
    const angle = random(i, 70) * TAU, r = 12 + random(i, 71) * 6;
    rock(petraGroup, i % 3 ? palette.stone : palette.darkStone,
      [Math.cos(angle) * r * .8, -.15 + random(i, 72) * .2, Math.sin(angle) * r * 1.25],
      [1 + random(i, 73) * 1.8, .6 + random(i, 74) * .6, 1.4 + random(i, 75)], 80 + i);
  }
  obstacles.push({ x: petra.x, z: petra.z, r: 12.5 * S });
  // This mapped coastal shelf is only centimetres above the reference sea level.
  // Preserve its actual elevation instead of raising a fabricated landing pad.
  const petraApproach = findLand(petra.x - 18 * S, petra.z - 21 * S, { radius: S, min: .0001, max: 4, slope: .8 });
  if (petraApproach) {
    anchor('petra', petraApproach);
    observe(petraGroup, '페트라의 바위', 'rock', '결이 다른 돌들이 바다 쪽으로 낮아집니다. 물과 바람이 암반의 가장자리를 지나갑니다.', petraApproach);
  }

  // Batched native scrub keeps the large island light to render. Nearby plants
  // form loose pockets, while distant vegetation remains sparse and irregular.
  const batches = new Map();
  function instance(geometry, mat, position, scale, quaternion) {
    const key = geometry.uuid + mat.uuid;
    if (!batches.has(key)) batches.set(key, { geometry, material: mat, matrices: [] });
    const q = quaternion || new THREE.Quaternion();
    batches.get(key).matrices.push(new THREE.Matrix4().compose(new THREE.Vector3(...position), q, new THREE.Vector3(...scale)));
  }
  function branch(start, end, radius) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), length = a.distanceTo(b);
    instance(unitPole, palette.darkWood, a.clone().add(b).multiplyScalar(.5).toArray(), [radius, length, radius],
      new THREE.Quaternion().setFromUnitVectors(up, b.sub(a).normalize()));
  }
  let vegetationCount = 0;
  const vegetationPositions = [];
  function olive(x, z, seed, shrub = false, interactive = false) {
    const g = land(x, z, .4 * S);
    if (!g || g.slope < .78) return false;
    if (obstacles.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 1.8 * S)) return false;
    if (Math.hypot(x - spawn.x, z - spawn.z) < 2.5 * S) return false;
    if (vegetationPositions.some(p => Math.hypot(p.x - x, p.z - z) < 2.8 * S)) return false;
    const height = shrub ? .55 + random(seed, 1) * .9 : 2.4 + random(seed, 1) * 2.2;
    const yaw = random(seed, 2) * TAU, tilt = .13 + random(seed, 3) * .25;
    const local = (lx, ly, lz) => [x + (lx * Math.cos(yaw) + lz * Math.sin(yaw)) * S,
      g.height + ly * S, z + (-lx * Math.sin(yaw) + lz * Math.cos(yaw)) * S];
    const crown = height * .73;
    if (!shrub) {
      branch(local(0, -.06, 0), local(-tilt * .65, crown * .29, .06), .106 * S);
      branch(local(-tilt * .65, crown * .26, .06), local(tilt, crown * .65, -.08), .081 * S);
      branch(local(tilt, crown * .61, -.08), local(.09, crown * .93, .06), .052 * S);
    }
    const count = shrub ? 5 : 12;
    for (let i = 0; i < count; i++) {
      const arm = i % 3, rank = Math.floor(i / 3);
      const angle = shrub ? i / count * TAU : arm / 3 * TAU + (rank - 1.5) * .18 + random(seed, 30) * .3;
      const extent = height * (shrub ? .42 : .43);
      const spread = shrub ? .72 : .46 + rank * .19;
      const bx = Math.cos(angle) * extent * spread + tilt * .35;
      const bz = Math.sin(angle) * extent * spread * .78;
      const by = crown + (random(seed, i + 40) - .53) * height * .19 + (rank - 1.4) * height * .035;
      if (!shrub && rank === 2) {
        const fork = local(bx * .53, crown * .81, bz * .53);
        branch(local(tilt * .6, crown * .53, 0), fork, .039 * S);
        branch(fork, local(bx * 1.2, by, bz * 1.2), .023 * S);
      }
      const mat = i % 3 === 0 ? palette.leafLight : i % 3 === 1 ? palette.leaf : palette.leafDark;
      instance(leafGeometry, mat, local(bx, by, bz),
        [height * (.115 + random(seed, i + 60) * .055) * S, height * (shrub ? .12 : .063) * S, height * .112 * S],
        new THREE.Quaternion().setFromEuler(new THREE.Euler((random(seed, i) - .5) * .29, angle + yaw, (random(seed, i + 70) - .5) * .22)));
    }
    if (interactive && !shrub) {
      const proxy = groupAt(x, z, 0, g.height);
      const hit = mesh(proxy, unitBall, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
        [0, height * .55, 0], [height * .47, height * .53, height * .43]);
      hit.castShadow = hit.receiveShadow = false;
      const approach = new THREE.Vector3(x, g.height, z).lerp(spawn, .2);
      observe(proxy, '바람에 굽은 올리브', 'olive', '올리브는 지중해에서 오래 재배해 온 상록수입니다. 좁은 잎의 뒷면은 은빛을 띠고, 나이 든 줄기는 굽고 갈라집니다.', approach);
    }
    vegetationPositions.push({ x, z }); vegetationCount++;
    return true;
  }

  for (const [i, dx, dz] of [[0, -14, -3], [1, 17, -12], [2, -18, -18], [3, 5, -18], [4, 20, 1], [5, -21, 1], [6, 18, -25], [7, -5, -24]]) {
    const p = worldOffset(spawn, harborYaw, dx, dz);
    olive(p.x, p.z, 900 + i, i === 4 || i === 5, i === 0);
  }

  // A few low shore stones and working objects tie the settlement to its coast.
  for (let i = 0; i < 22; i++) {
    const side = i % 2 ? -1 : 1;
    const point = worldOffset(shorePoint, harborYaw, side * (3.2 + random(i, 282) * 16), -1.2 - random(i, 283) * 2.7);
    const g = sample(point.x, point.z);
    if (!g || g.height > 1.7 * S) continue;
    const stone = groupAt(point.x, point.z, random(i, 284) * TAU, g.height - .06 * S);
    rock(stone, i % 4 ? palette.stone : palette.darkStone, [0, .16, 0],
      [.3 + random(i, 285) * .38, .19 + random(i, 286) * .14, .24 + random(i, 287) * .32], 300 + i);
    if (i % 4 === 0) olive(point.x + .035, point.z + .05, 4100 + i, true);
  }
  const amphoraPoint = worldOffset(spawn, harborYaw, -5, -5);
  if (land(amphoraPoint.x, amphoraPoint.z)) {
    const storage = groupAt(amphoraPoint.x, amphoraPoint.z, harborYaw);
    jug(storage, 0, 0, 1.1); jug(storage, .41, -.22, .75); basket(storage, -.47, -.15, .85);
    observe(storage, '문밖의 토기', 'amphora', '손에 닿는 곳에 물항아리와 바구니가 놓여 있습니다. 닳은 가장자리에 하루의 흔적이 남아 있습니다.', storage.position);
  }
  const timberPoint = worldOffset(spawn, harborYaw, -17, -3);
  if (land(timberPoint.x, timberPoint.z)) {
    const timber = groupAt(timberPoint.x, timberPoint.z, harborYaw + .28);
    for (let i = 0; i < 4; i++) {
      const x = (i % 3 - 1) * .19, y = i === 3 ? .28 : .11;
      limb(timber, palette.wood, [x, y, -.67 - random(i, 33) * .1], [x + .06, y + .02, .65 + random(i, 34) * .15], .105);
    }
    observe(timber, '손질해 둔 목재', 'timber', '작은 배에 쓸 나무가 바람을 맞으며 마릅니다. 거친 결 사이에 소금기가 남아 있습니다.', timber.position);
  }
  for (const id of ['cave', 'olive', 'garden', 'north', 'ridge']) {
    const p = placePositions[id] || at(id);
    for (let i = 0; i < 35; i++) {
      const r = (8 + random(i, id.length * 23) * 88) * S;
      const angle = random(i, id.charCodeAt(0)) * TAU;
      olive(p.x + Math.cos(angle) * r, p.z + Math.sin(angle) * r, 1200 + i + id.length * 32, i % 3 !== 0);
    }
  }
  for (let i = 0; i < 3600 && vegetationCount < 310; i++) {
    const x = -140 + random(i, 231) * 272, z = -214 + random(i, 232) * 428;
    olive(x, z, 3200 + i, i % 5 !== 0);
  }
  for (const batch of batches.values()) {
    const object = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
    for (let i = 0; i < batch.matrices.length; i++) object.setMatrixAt(i, batch.matrices[i]);
    object.castShadow = object.receiveShadow = true;
    object.instanceMatrix.needsUpdate = true;
    object.computeBoundingSphere();
    root.add(object);
  }

  // Three walkers follow short, fully sampled loops along the open harbor lanes.
  const routeSlots = [[[-3, 0], [3, 0], [5, -3], [-3, -4]], [[-11, 2], [-5, 2], [-4, -1], [-10, -1]], [[5, 3], [12, 3], [14, 0], [6, -1]]];
  const routeIsClear = (a, b) => {
    const steps = Math.ceil(a.distanceTo(b) / (S * .45));
    for (let i = 0; i <= steps; i++) {
      const p = a.clone().lerp(b, i / Math.max(1, steps));
      if (!land(p.x, p.z, .1 * S) || obstacles.some(o => Math.hypot(o.x - p.x, o.z - p.z) < o.r + .27 * S)) return false;
    }
    return true;
  };
  for (let i = 0; i < routeSlots.length; i++) {
    const route = routeSlots[i].map(([x, z]) => worldOffset(spawn, harborYaw, x, z));
    if (!route.every((p, j) => routeIsClear(p, route[(j + 1) % route.length]))) continue;
    const person = createWalker({ color: ['#69736b', '#73716b', '#58636a'][i], scarf: ['#8b8371', '#706f62', '#8b7a65'][i], scale: S });
    root.add(person.root);
    person.root.name = 'harbor-walker';
    person.root.position.copy(route[0]); person.root.position.y = sample(route[0].x, route[0].z).height;
    const entry = observe(person.root, ['항구를 걷는 이', '돌집 곁의 주민', '그물을 살피는 이'][i], 'person',
      ['“바람이 잦아들면 배를 다시 묶어 두어야겠어요.”', '“멀리 걷기 전에는 그늘에서 잠시 쉬어 가세요.”', '“이 만에서는 바깥 바다의 소리가 작게 들립니다.”'][i], person.root.position);
    people.push({ ...person, route, target: 1, pause: i * 1.5, phase: i * 2.7, entry });
  }
  // If a lane is constrained by source terrain, retain a grounded, quiet resident.
  while (people.length < 2) {
    const i = people.length, point = worldOffset(spawn, harborYaw, i ? -2 : 2, -2);
    const p = findLand(point.x, point.z, { radius: .3 * S, min: .1 * S, max: .12 });
    if (!p || obstacles.some(o => Math.hypot(o.x - p.x, o.z - p.z) < o.r + .4 * S)) break;
    const person = createWalker({ color: i ? '#747066' : '#636f69', scale: S });
    root.add(person.root); person.root.position.copy(p); person.root.rotation.y = harborYaw;
    const entry = observe(person.root, '항구의 주민', 'person', '“바다 쪽으로 내려가면 작은 부두가 있어요.”', p);
    people.push({ ...person, route: null, phase: i, entry });
  }

  for (const id of Object.keys(defaults)) {
    if (placePositions[id]) continue;
    const p = at(id), grounded = findLand(p.x, p.z, { radius: .4 * S, min: .3 * S, max: 4 });
    if (grounded) anchor(id, grounded);
  }
  const player = createWalker({ color: '#596474', scarf: '#ad9675', scale: S });
  player.root.name = 'player';
  player.root.position.copy(spawn); player.root.rotation.y = harborYaw;
  root.add(player.root);

  const articulated = new Set([player.root, ...people.map(person => person.root)]);
  for (const child of [...root.children]) if (child.isGroup && !articulated.has(child)) batchStaticGroup(child);

  root.userData.scaleMetresToWorld = S;
  root.userData.dimensionsMetres = LIFE_DIMENSIONS;
  root.userData.counts = { houses: houseCount, boats: boats.length, people: people.length, vegetation: vegetationCount };
  return {
    root, player, spawn: spawn.clone(), placePositions, interactables, obstacles, walkSurfaces,
    harbor: { shore: shorePoint.clone(), yaw: harborYaw, pier: pierCenter.clone() },
    update(time, dt = 1 / 60) {
      const delta = clamp(dt, 0, .075);
      for (const boat of boats) {
        boat.object.position.y = boat.y + Math.sin(time * .85 + boat.phase) * .035 * S;
        boat.object.rotation.z = Math.sin(time * .65 + boat.phase) * .019;
        boat.object.rotation.x = Math.sin(time * .73 + boat.phase + 1.3) * .011;
      }
      for (const person of people) {
        let walking = false;
        if (person.route) {
          person.pause -= delta;
          if (person.pause <= 0) {
            const destination = person.route[person.target], dx = destination.x - person.root.position.x, dz = destination.z - person.root.position.z;
            const distance = Math.hypot(dx, dz), travel = .73 * S * delta;
            if (distance < travel + .005 * S) {
              person.target = (person.target + 1) % person.route.length;
              person.pause = 1.1 + random(person.target, person.phase) * 2.7;
            } else {
              person.root.position.x += dx / distance * travel; person.root.position.z += dz / distance * travel;
              person.root.position.y = sample(person.root.position.x, person.root.position.z)?.height ?? person.root.position.y;
              person.root.rotation.y = Math.atan2(dx, dz);
              walking = true;
            }
          }
        }
        person.update(time + person.phase, walking);
        person.entry.position.copy(person.root.position);
      }
    },
  };
}
