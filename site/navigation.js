/**
 * Terrain-only, dependency-free walking navigation. All distances use world units.
 * ground(x, z) returns { height, slope }, where slope is the upward normal's Y
 * component (the existing terrain sampler convention), or { height, gradient }.
 * The terrain and obstacle circles must remain unchanged for this navigator.
 */
export function createNavigator({
  ground,
  bounds = { minX: -160, maxX: 160, minZ: -230, maxZ: 230 },
  obstacles = [],
  step = .35,
  // Petra's mapped shelf is only ~0.0008 world units above the reference sea.
  // Preserve positive coastal ground while excluding zero-height shore/water.
  minHeight = .00015,
  maxGradient = 1.1,
  clearance = .012,
  maxVisited = 350000,
  localRadius = 2,
  localStep = .025,
} = {}) {
  if (typeof ground !== 'function') throw new TypeError('Navigation requires a ground sampler.');
  const { minX, maxX, minZ, maxZ } = bounds;
  if (![minX, maxX, minZ, maxZ, step].every(Number.isFinite) || step <= 0 || minX >= maxX || minZ >= maxZ) {
    throw new RangeError('Navigation requires finite bounds and a positive grid step.');
  }
  const width = Math.floor((maxX - minX) / step) + 1;
  const depth = Math.floor((maxZ - minZ) / step) + 1;
  const count = width * depth;
  const minimumNormal = 1 / Math.sqrt(1 + maxGradient * maxGradient);
  // Final routes use sub-footprint probes, including the very narrow steep
  // triangles in the coastline mesh. Search edges use cheaper provisional
  // probes, then a candidate route is fully validated before it can be returned.
  const probeStep = Math.min(step / 16, .008);
  const searchProbeStep = Math.min(step / 4, .09);
  const circles = obstacles.map(o => ({ x: o.x, z: o.z, r: (o.r ?? o.radius ?? 0) + clearance }))
    .filter(o => [o.x, o.z, o.r].every(Number.isFinite) && o.r > 0);
  // A small spatial hash keeps thousands of trees from taxing each terrain probe.
  const bucketSize = Math.max(step * 4, 1);
  const buckets = new Map();
  for (const circle of circles) {
    for (let z = Math.floor((circle.z - circle.r) / bucketSize); z <= Math.floor((circle.z + circle.r) / bucketSize); z++) {
      for (let x = Math.floor((circle.x - circle.r) / bucketSize); x <= Math.floor((circle.x + circle.r) / bucketSize); x++) {
        const key = `${x},${z}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(circle);
      }
    }
  }

  const inBounds = (x, z) => Number.isFinite(x) && Number.isFinite(z) && x >= minX && x <= maxX && z >= minZ && z <= maxZ;
  const pointObstructed = (x, z) => {
    for (const circle of buckets.get(`${Math.floor(x / bucketSize)},${Math.floor(z / bucketSize)}`) || []) {
      if ((x - circle.x) ** 2 + (z - circle.z) ** 2 <= circle.r ** 2) return true;
    }
    return false;
  };

  function terrain(x, z) {
    if (!inBounds(x, z) || pointObstructed(x, z)) return null;
    const sample = ground(x, z);
    if (!sample || !Number.isFinite(sample.height) || sample.height < minHeight) return null;
    const normal = sample.normalY ?? sample.slope;
    if (Number.isFinite(sample.gradient)) {
      if (Math.abs(sample.gradient) > maxGradient) return null;
    } else if (Number.isFinite(normal)) {
      if (normal < minimumNormal) return null;
    } else {
      // Also support a height-only sampler without assuming every hillside is safe.
      const e = Math.min(step / 4, .05);
      const l = ground(Math.max(minX, x - e), z), r = ground(Math.min(maxX, x + e), z);
      const a = ground(x, Math.max(minZ, z - e)), b = ground(x, Math.min(maxZ, z + e));
      if (!l || !r || !a || !b) return null;
      const dx = (r.height - l.height) / (Math.min(maxX, x + e) - Math.max(minX, x - e));
      const dz = (b.height - a.height) / (Math.min(maxZ, z + e) - Math.max(minZ, z - e));
      if (!Number.isFinite(dx + dz) || Math.hypot(dx, dz) > maxGradient) return null;
    }
    return { x, y: sample.height, z };
  }

  const isWalkable = (x, z) => terrain(x, z) !== null;

  function nearest(x, z, maxRadius = 8) {
    if (![x, z, maxRadius].every(Number.isFinite) || maxRadius < 0) return null;
    const origin = terrain(x, z);
    if (origin) return origin;
    // Search concentric rings at half-cell spacing, including the exact radius.
    const radialStep = step / 2;
    const rings = Math.ceil(maxRadius / radialStep);
    for (let ring = 1; ring <= rings; ring++) {
      const radius = Math.min(maxRadius, ring * radialStep);
      const probes = Math.max(12, Math.ceil(Math.PI * 2 * radius / radialStep));
      for (let i = 0; i < probes; i++) {
        const angle = i * Math.PI * 2 / probes;
        const point = terrain(x + Math.cos(angle) * radius, z + Math.sin(angle) * radius);
        if (point) return point;
      }
    }
    return null;
  }

  // Allocate and sample nothing over the million-cell world until a route needs it.
  let cellState, height, checkedEdges, openEdges, verifiedEdges, seen, closed, cost, parent, generation = 0;
  function allocateGrid() {
    if (cellState) return;
    cellState = new Uint8Array(count);
    height = new Float32Array(count);
    checkedEdges = new Uint8Array(count);
    openEdges = new Uint8Array(count);
    verifiedEdges = new Uint8Array(count);
    seen = new Uint32Array(count);
    closed = new Uint32Array(count);
    cost = new Float64Array(count);
    parent = new Int32Array(count);
  }
  function cell(x, z) {
    if (x < 0 || z < 0 || x >= width || z >= depth) return -1;
    const id = z * width + x;
    if (!cellState[id]) {
      const point = terrain(minX + x * step, minZ + z * step);
      cellState[id] = point ? 1 : 2;
      if (point) height[id] = point.y;
    }
    return cellState[id] === 1 ? id : -1;
  }
  const coordinates = id => ({ x: minX + (id % width) * step, y: height[id], z: minZ + Math.floor(id / width) * step });

  function segmentObstructed(a, b) {
    const dx = b.x - a.x, dz = b.z - a.z, lengthSquared = dx * dx + dz * dz;
    const touches = circle => {
      if (circle.x + circle.r < Math.min(a.x, b.x) || circle.x - circle.r > Math.max(a.x, b.x) ||
          circle.z + circle.r < Math.min(a.z, b.z) || circle.z - circle.r > Math.max(a.z, b.z)) return false;
      const t = lengthSquared ? Math.max(0, Math.min(1, ((circle.x - a.x) * dx + (circle.z - a.z) * dz) / lengthSquared)) : 0;
      return (a.x + t * dx - circle.x) ** 2 + (a.z + t * dz - circle.z) ** 2 <= circle.r ** 2;
    };
    const bx0 = Math.floor(Math.min(a.x, b.x) / bucketSize), bx1 = Math.floor(Math.max(a.x, b.x) / bucketSize);
    const bz0 = Math.floor(Math.min(a.z, b.z) / bucketSize), bz1 = Math.floor(Math.max(a.z, b.z) / bucketSize);
    if ((bx1 - bx0 + 1) * (bz1 - bz0 + 1) < Math.max(8, circles.length)) {
      for (let z = bz0; z <= bz1; z++) for (let x = bx0; x <= bx1; x++) {
        for (const circle of buckets.get(`${x},${z}`) || []) if (touches(circle)) return true;
      }
    } else {
      for (const circle of circles) if (touches(circle)) return true;
    }
    return false;
  }

  function sampleSegment(a, b, spacing = probeStep) {
    if (segmentObstructed(a, b)) return false;
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    if (!length) return true;
    const samples = Math.max(1, Math.ceil(length / spacing));
    const interval = length / samples;
    let previous = a.y;
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const p = i === samples ? b : terrain(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
      if (!p || Math.abs(p.y - previous) > maxGradient * interval + 1e-6) return false;
      previous = p.y;
    }
    return true;
  }

  // Supercover traversal checks every cell touched by a shortcut. In particular,
  // a ray through a grid corner must pass both adjacent orthogonal cells.
  function gridSegment(a, b, allowEndpointCells = false) {
    let x = Math.max(0, Math.min(width - 1, Math.round((a.x - minX) / step)));
    let z = Math.max(0, Math.min(depth - 1, Math.round((a.z - minZ) / step)));
    const targetX = Math.max(0, Math.min(width - 1, Math.round((b.x - minX) / step)));
    const targetZ = Math.max(0, Math.min(depth - 1, Math.round((b.z - minZ) / step)));
    const initialX = x, initialZ = z;
    const dx = (b.x - a.x) / step, dz = (b.z - a.z) / step;
    const sx = Math.sign(dx), sz = Math.sign(dz);
    const startX = (a.x - minX) / step, startZ = (a.z - minZ) / step;
    let tx = sx ? (x + sx * .5 - startX) / dx : Infinity;
    let tz = sz ? (z + sz * .5 - startZ) / dz : Infinity;
    const deltaX = sx ? Math.abs(1 / dx) : Infinity, deltaZ = sz ? Math.abs(1 / dz) : Infinity;
    if (cell(x, z) < 0 && !allowEndpointCells) return false;
    while (x !== targetX || z !== targetZ) {
      if (Math.abs(tx - tz) < 1e-9) {
        if (cell(x + sx, z) < 0 || cell(x, z + sz) < 0) return false;
        x += sx; z += sz; tx += deltaX; tz += deltaZ;
      } else if (tx < tz) {
        x += sx; tx += deltaX;
      } else {
        z += sz; tz += deltaZ;
      }
      if (cell(x, z) < 0 && !(allowEndpointCells && ((x === initialX && z === initialZ) || (x === targetX && z === targetZ)))) return false;
    }
    return true;
  }

  const directions = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]];
  const opposite = [2, 3, 0, 1, 6, 7, 4, 5];
  function edge(id, next, direction, x, z) {
    const mask = 1 << direction;
    if (checkedEdges[id] & mask) return !!(openEdges[id] & mask);
    checkedEdges[id] |= mask;
    checkedEdges[next] |= 1 << opposite[direction];
    const [dx, dz] = directions[direction];
    if (dx && dz && (cell(x + dx, z) < 0 || cell(x, z + dz) < 0)) return false;
    if (!sampleSegment(coordinates(id), coordinates(next), searchProbeStep)) return false;
    openEdges[id] |= mask;
    openEdges[next] |= 1 << opposite[direction];
    return true;
  }

  function attachments(point) {
    const x = Math.round((point.x - minX) / step), z = Math.round((point.z - minZ) / step);
    const options = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const id = cell(x + dx, z + dz);
      if (id < 0) continue;
      const p = coordinates(id);
      if (gridSegment(point, p, true) && sampleSegment(point, p)) options.push({ id, distance: Math.hypot(point.x - p.x, point.y - p.y, point.z - p.z) });
    }
    return options;
  }

  function finish(raw) {
    const points = [raw[0]];
    let anchor = 0;
    // Binary backoff bounds failed shortcut work on winding coastlines. Every
    // accepted shortcut still receives complete terrain and supercover checks.
    while (anchor < raw.length - 1) {
      let next = raw.length - 1;
      while (next > anchor + 1 && (!gridSegment(raw[anchor], raw[next]) || !sampleSegment(raw[anchor], raw[next]))) {
        next = anchor + Math.max(1, Math.floor((next - anchor) / 2));
      }
      const point = raw[next];
      if (Math.hypot(point.x - points.at(-1).x, point.z - points.at(-1).z) > 1e-8) points.push(point);
      anchor = next;
    }
    // Keep enough height samples for a route ribbon to follow the ground. The
    // moving character should sample ground at its actual interpolated x/z.
    const draped = [points[0]];
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      const divisions = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (step * 2)));
      for (let j = 1; j <= divisions; j++) {
        const t = j / divisions;
        const point = j === divisions ? b : terrain(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
        if (!point) return { points: [], distance: 0, reason: 'terrain-changed' };
        const previous = draped.at(-1);
        distance += Math.hypot(point.x - previous.x, point.y - previous.y, point.z - previous.z);
        draped.push(point);
      }
    }
    return { points: draped, distance };
  }

  function search(starts, targetIds, destination, visitLimit) {
    const heap = new MinHeap();
    if (++generation === 0xffffffff) { seen.fill(0); closed.fill(0); generation = 1; }
    const heuristic = id => {
      const x = minX + (id % width) * step, z = minZ + Math.floor(id / width) * step;
      return Math.hypot(x - destination.x, z - destination.z);
    };
    for (const option of starts) {
      seen[option.id] = generation;
      cost[option.id] = option.distance;
      parent[option.id] = -1;
      heap.push(option.id, option.distance + heuristic(option.id));
    }
    let visited = 0;
    while (heap.length) {
      const id = heap.pop();
      if (closed[id] === generation) continue;
      if (++visited > visitLimit) return { visited, reason: 'search-limit' };
      closed[id] = generation;
      if (targetIds.has(id)) {
        const ids = [];
        for (let p = id; p !== -1; p = parent[p]) ids.push(p);
        ids.reverse();
        return { ids, visited };
      }
      const x = id % width, z = Math.floor(id / width);
      for (let direction = 0; direction < directions.length; direction++) {
        const [dx, dz] = directions[direction], next = cell(x + dx, z + dz);
        if (next < 0 || closed[next] === generation || !edge(id, next, direction, x, z)) continue;
        const nextCost = cost[id] + Math.hypot(dx * step, dz * step, height[next] - height[id]);
        if (seen[next] === generation && nextCost >= cost[next]) continue;
        seen[next] = generation;
        cost[next] = nextCost;
        parent[next] = id;
        heap.push(next, nextCost + heuristic(next));
      }
    }
    return { visited, reason: 'unreachable' };
  }

  function validateEdges(ids) {
    let valid = true;
    for (let i = 1; i < ids.length; i++) {
      const id = ids[i - 1], next = ids[i];
      const dx = next % width - id % width, dz = Math.floor(next / width) - Math.floor(id / width);
      const direction = directions.findIndex(d => d[0] === dx && d[1] === dz);
      const mask = 1 << direction, reverseMask = 1 << opposite[direction];
      if (verifiedEdges[id] & mask) continue;
      verifiedEdges[id] |= mask;
      verifiedEdges[next] |= reverseMask;
      if (!sampleSegment(coordinates(id), coordinates(next))) {
        openEdges[id] &= ~mask;
        openEdges[next] &= ~reverseMask;
        valid = false;
      }
    }
    return valid;
  }

  function findPath(from, to) {
    const start = from && terrain(from.x, from.z);
    if (!start) return { points: [], distance: 0, reason: 'start-blocked' };
    const destination = to && terrain(to.x, to.z);
    if (!destination) return { points: [], distance: 0, reason: 'destination-blocked' };
    const separation = Math.hypot(start.x - destination.x, start.z - destination.z);
    if (separation < 1e-8) return { points: [start], distance: 0 };
    // Short walks need a human-scale grid: the pier is only .06475 units wide,
    // and houses can sit between two cells of the island-wide grid. Search a
    // bounded neighbourhood rather than flood the island for a blocked local tap.
    // A local failure remains a failure; no unbounded global search follows it.
    if (localRadius > 0 && separation <= localRadius && localStep > 0 && step > localStep * 1.5) {
      const margin = Math.max(step * 2, separation / 2, .4);
      const local = createNavigator({
        ground,
        bounds: {
          minX: Math.max(minX, Math.min(start.x, destination.x) - margin),
          maxX: Math.min(maxX, Math.max(start.x, destination.x) + margin),
          minZ: Math.max(minZ, Math.min(start.z, destination.z) - margin),
          maxZ: Math.min(maxZ, Math.max(start.z, destination.z) + margin),
        },
        obstacles, step: Math.min(localStep, step / 8), minHeight, maxGradient,
        clearance, maxVisited: Math.min(maxVisited, 30000), localRadius: 0,
      });
      return local.findPath(start, destination);
    }
    allocateGrid();
    if (gridSegment(start, destination) && sampleSegment(start, destination)) return finish([start, destination]);
    const starts = attachments(start), targets = attachments(destination);
    if (!starts.length || !targets.length) return { points: [], distance: 0, reason: 'no-grid-access' };
    const targetIds = new Set(targets.map(p => p.id));
    let remaining = maxVisited;
    while (remaining > 0) {
      const result = search(starts, targetIds, destination, remaining);
      remaining -= result.visited;
      if (!result.ids) return { points: [], distance: 0, reason: result.reason };
      // Reject every unsafe edge discovered on this candidate in one pass, then
      // search again with those edges closed. No partial candidate is exposed.
      if (validateEdges(result.ids)) return finish([start, ...result.ids.map(coordinates), destination]);
    }
    return { points: [], distance: 0, reason: 'search-limit' };
  }

  return { nearest, findPath, isWalkable };
}

class MinHeap {
  constructor() { this.ids = []; this.scores = []; }
  get length() { return this.ids.length; }
  push(id, score) {
    let index = this.ids.length;
    this.ids.push(id); this.scores.push(score);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.scores[parent] <= score) break;
      this.ids[index] = this.ids[parent]; this.scores[index] = this.scores[parent]; index = parent;
    }
    this.ids[index] = id; this.scores[index] = score;
  }
  pop() {
    const result = this.ids[0], id = this.ids.pop(), score = this.scores.pop();
    if (this.ids.length) {
      let index = 0;
      while (index * 2 + 1 < this.ids.length) {
        let child = index * 2 + 1;
        if (child + 1 < this.ids.length && this.scores[child + 1] < this.scores[child]) child++;
        if (this.scores[child] >= score) break;
        this.ids[index] = this.ids[child]; this.scores[index] = this.scores[child]; index = child;
      }
      this.ids[index] = id; this.scores[index] = score;
    }
    return result;
  }
}
