const INVALID_BODY: u32 = 0xffffffffu;
const SHAPE_SPHERE: u32 = 0u;
const SHAPE_BOX: u32 = 1u;
const SHAPE_CAPSULE: u32 = 2u;
const EPS: f32 = 1.0e-6;
const SUPPORT_BIT: u32 = 0x80000000u;
const CONTACT_MASK: u32 = 0x7fffffffu;
const FLOOR_CONTACT_MARGIN: f32 = 0.01;
const BOX_CONTACT_MARGIN: f32 = 0.01;
const WARM_CONTACTS: u32 = 16u;

struct Body {
  position: vec4<f32>,
  velocity: vec4<f32>,
  shape: vec4<f32>,
  orientation: vec4<f32>,
  angularVelocity: vec4<f32>,
  flags: vec4<u32>,
}

struct WarmContact {
  normalLambda: vec4<f32>,
  tangent: vec3<f32>,
  pair: u32,
  localPoint: vec3<f32>,
  seen: u32,
}
struct WarmBody {
  contacts: array<WarmContact, 16>,
}

struct SimulationParams {
  dt: f32,
  gravity: f32,
  cellSize: f32,
  correction: f32,
  bodyCount: u32,
  cellCount: u32,
  gridX: u32,
  gridY: u32,
  gridZ: u32,
  solverIteration: u32,
  solverIterations: u32,
  _pad0: u32,
  gridMin: vec4<f32>,
}

struct Collision {
  normal: vec3<f32>,
  penetration: f32,
  point: vec3<f32>,
  hit: u32,
}

struct Correction {
  linear: vec3<f32>,
  supported: u32,
  angular: vec3<f32>,
  hit: u32,
  velocity: vec3<f32>,
  angularVelocity: vec3<f32>,
}

struct Segment { a: vec3<f32>, b: vec3<f32> }
struct PointPair { a: vec3<f32>, b: vec3<f32> }

struct Counters {
  awake: atomic<u32>,
  contacting: atomic<u32>,
  maxCellChain: atomic<u32>,
  cacheOverflow: atomic<u32>,
}

@group(0) @binding(0) var<storage, read_write> bodies: array<Body>;
@group(0) @binding(1) var<storage, read> snapshot: array<Body>;
@group(0) @binding(2) var<storage, read_write> warmBodies: array<WarmBody>;
@group(0) @binding(3) var<storage, read_write> cellHead: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> nextBody: array<u32>;
@group(0) @binding(5) var<uniform> params: SimulationParams;
@group(0) @binding(6) var<storage, read_write> counters: Counters;

fn isAwake(body: Body) -> bool { return body.flags.y != 0u; }
fn safeSign(value: f32) -> f32 { return select(1.0, -1.0, value < 0.0); }

fn quatMul(a: vec4<f32>, b: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(
    a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz),
    a.w * b.w - dot(a.xyz, b.xyz)
  );
}
fn quatConjugate(q: vec4<f32>) -> vec4<f32> { return vec4<f32>(-q.xyz, q.w); }
fn quatRotate(q: vec4<f32>, value: vec3<f32>) -> vec3<f32> {
  let t = 2.0 * cross(q.xyz, value);
  return value + q.w * t + cross(q.xyz, t);
}
fn inverseRotate(q: vec4<f32>, value: vec3<f32>) -> vec3<f32> {
  return quatRotate(quatConjugate(q), value);
}
fn integrateOrientation(q: vec4<f32>, omega: vec3<f32>, dt: f32) -> vec4<f32> {
  return normalize(q + 0.5 * dt * quatMul(vec4<f32>(omega, 0.0), q));
}
fn applyAngularCorrection(q: vec4<f32>, delta: vec3<f32>) -> vec4<f32> {
  return normalize(q + 0.5 * quatMul(vec4<f32>(delta, 0.0), q));
}

fn boxAxis(body: Body, axis: u32) -> vec3<f32> {
  if (axis == 0u) { return quatRotate(body.orientation, vec3<f32>(1.0, 0.0, 0.0)); }
  if (axis == 1u) { return quatRotate(body.orientation, vec3<f32>(0.0, 1.0, 0.0)); }
  return quatRotate(body.orientation, vec3<f32>(0.0, 0.0, 1.0));
}
fn capsuleSegment(body: Body) -> Segment {
  let axis = boxAxis(body, 0u);
  return Segment(body.position.xyz - axis * body.shape.y, body.position.xyz + axis * body.shape.y);
}
fn supportCoefficient(projection: f32, extent: f32) -> f32 {
  if (abs(projection) < 1.0e-5) { return 0.0; }
  return safeSign(projection) * extent;
}
fn supportPoint(body: Body, direction: vec3<f32>) -> vec3<f32> {
  if (body.flags.x == SHAPE_SPHERE) {
    return body.position.xyz + normalize(direction) * body.shape.x;
  }
  if (body.flags.x == SHAPE_CAPSULE) {
    let axis = boxAxis(body, 0u);
    return body.position.xyz + axis * supportCoefficient(dot(axis, direction), body.shape.y) +
      normalize(direction) * body.shape.x;
  }
  let x = boxAxis(body, 0u); let y = boxAxis(body, 1u); let z = boxAxis(body, 2u);
  return body.position.xyz +
    x * supportCoefficient(dot(x, direction), body.shape.x) +
    y * supportCoefficient(dot(y, direction), body.shape.y) +
    z * supportCoefficient(dot(z, direction), body.shape.z);
}
fn worldHalfExtent(body: Body) -> vec3<f32> {
  if (body.flags.x == SHAPE_SPHERE) { return vec3<f32>(body.shape.x); }
  if (body.flags.x == SHAPE_CAPSULE) {
    return vec3<f32>(body.shape.x) + abs(boxAxis(body, 0u)) * body.shape.y;
  }
  return abs(boxAxis(body, 0u)) * body.shape.x +
    abs(boxAxis(body, 1u)) * body.shape.y +
    abs(boxAxis(body, 2u)) * body.shape.z;
}
fn inverseInertia(body: Body, worldVector: vec3<f32>) -> vec3<f32> {
  let invMass = body.shape.w;
  if (invMass <= 0.0) { return vec3<f32>(0.0); }
  var diagonal = vec3<f32>(0.0);
  if (body.flags.x == SHAPE_SPHERE) {
    diagonal = vec3<f32>(2.5 * invMass / max(body.shape.x * body.shape.x, EPS));
  } else if (body.flags.x == SHAPE_CAPSULE) {
    let radius = body.shape.x; let halfLength = body.shape.y;
    diagonal.x = 2.5 * invMass / max(radius * radius, EPS);
    diagonal.yz = vec2<f32>(3.0 * invMass /
      max((halfLength + radius) * (halfLength + radius), EPS));
  } else {
    diagonal = 3.0 * invMass / max(vec3<f32>(
      body.shape.y * body.shape.y + body.shape.z * body.shape.z,
      body.shape.x * body.shape.x + body.shape.z * body.shape.z,
      body.shape.x * body.shape.x + body.shape.y * body.shape.y
    ), vec3<f32>(EPS));
  }
  return quatRotate(body.orientation,
    inverseRotate(body.orientation, worldVector) * diagonal);
}

fn gridCoord(position: vec3<f32>) -> vec3<u32> {
  let raw = vec3<i32>(floor((position - params.gridMin.xyz) / params.cellSize));
  return vec3<u32>(clamp(raw, vec3<i32>(0), vec3<i32>(
    i32(params.gridX) - 1, i32(params.gridY) - 1, i32(params.gridZ) - 1)));
}
fn gridIndex(coord: vec3<u32>) -> u32 {
  return coord.x + params.gridX * (coord.y + params.gridY * coord.z);
}
fn aabbMayOverlap(a: Body, b: Body, padding: f32) -> bool {
  return all(abs(a.position.xyz - b.position.xyz) <=
    worldHalfExtent(a) + worldHalfExtent(b) + vec3<f32>(padding));
}

fn noCollision() -> Collision {
  return Collision(vec3<f32>(0.0), 0.0, vec3<f32>(0.0), 0u);
}
fn sphereSphere(a: Body, b: Body) -> Collision {
  let delta = a.position.xyz - b.position.xyz;
  let distance = length(delta);
  let penetration = a.shape.x + b.shape.x - distance;
  if (penetration <= 0.0) { return noCollision(); }
  let normal = select(vec3<f32>(0.0, 0.0, -1.0), delta / max(distance, EPS), distance > EPS);
  return Collision(normal, penetration,
    b.position.xyz + normal * (b.shape.x - penetration * 0.5), 1u);
}
fn closestPointOnSegment(point: vec3<f32>, a: vec3<f32>, b: vec3<f32>) -> vec3<f32> {
  let ab = b - a;
  let t = clamp(dot(point - a, ab) / max(dot(ab, ab), EPS), 0.0, 1.0);
  return a + ab * t;
}
fn closestSegmentPoints(a0: vec3<f32>, a1: vec3<f32>, b0: vec3<f32>, b1: vec3<f32>) -> PointPair {
  let d1 = a1 - a0; let d2 = b1 - b0; let r = a0 - b0;
  let a = dot(d1, d1); let e = dot(d2, d2); let f = dot(d2, r);
  var s = 0.0; var t = 0.0;
  if (a <= EPS && e <= EPS) { return PointPair(a0, b0); }
  if (a <= EPS) { t = clamp(f / max(e, EPS), 0.0, 1.0); }
  else {
    let c = dot(d1, r);
    if (e <= EPS) { s = clamp(-c / max(a, EPS), 0.0, 1.0); }
    else {
      let b = dot(d1, d2); let denominator = a * e - b * b;
      if (abs(denominator) > EPS) { s = clamp((b * f - c * e) / denominator, 0.0, 1.0); }
      t = (b * s + f) / e;
      if (t < 0.0) { t = 0.0; s = clamp(-c / max(a, EPS), 0.0, 1.0); }
      else if (t > 1.0) { t = 1.0; s = clamp((b - c) / max(a, EPS), 0.0, 1.0); }
    }
  }
  return PointPair(a0 + d1 * s, b0 + d2 * t);
}
fn sphereBox(sphere: Body, box: Body) -> Collision {
  let local = inverseRotate(box.orientation, sphere.position.xyz - box.position.xyz);
  var nearest = clamp(local, -box.shape.xyz, box.shape.xyz);
  let delta = local - nearest; let distance = length(delta);
  var localNormal = vec3<f32>(0.0); var penetration = 0.0;
  if (distance > EPS) {
    penetration = sphere.shape.x - distance;
    if (penetration <= 0.0) { return noCollision(); }
    localNormal = delta / distance;
  } else {
    let face = box.shape.xyz - abs(local);
    var axis = 0u; var depth = face.x;
    if (face.y < depth) { axis = 1u; depth = face.y; }
    if (face.z < depth) { axis = 2u; depth = face.z; }
    localNormal[axis] = safeSign(local[axis]);
    nearest[axis] = localNormal[axis] * box.shape[axis];
    penetration = sphere.shape.x + depth;
  }
  let normal = quatRotate(box.orientation, localNormal);
  return Collision(normal, penetration,
    box.position.xyz + quatRotate(box.orientation, nearest), 1u);
}
fn sphereCapsule(sphere: Body, capsule: Body) -> Collision {
  let segment = capsuleSegment(capsule);
  let point = closestPointOnSegment(sphere.position.xyz, segment.a, segment.b);
  let delta = sphere.position.xyz - point; let distance = length(delta);
  let penetration = sphere.shape.x + capsule.shape.x - distance;
  if (penetration <= 0.0) { return noCollision(); }
  let normal = select(vec3<f32>(0.0, 1.0, 0.0), delta / max(distance, EPS), distance > EPS);
  return Collision(normal, penetration, point + normal * capsule.shape.x, 1u);
}
fn capsuleCapsule(a: Body, b: Body) -> Collision {
  let sa = capsuleSegment(a); let sb = capsuleSegment(b);
  let pair = closestSegmentPoints(sa.a, sa.b, sb.a, sb.b);
  let delta = pair.a - pair.b; let distance = length(delta);
  let penetration = a.shape.x + b.shape.x - distance;
  if (penetration <= 0.0) { return noCollision(); }
  var normal = delta / max(distance, EPS);
  if (distance <= EPS) {
    let crossed = cross(boxAxis(a, 0u), boxAxis(b, 0u));
    if (dot(crossed, crossed) > EPS * EPS) { normal = normalize(crossed); }
    else {
      // Canonicalize a parallel axis before choosing its perpendicular so
      // swapping bodies reverses the normal even with overlapping segments.
      var axis = boxAxis(a, 0u);
      var major = 0u;
      if (abs(axis.y) > abs(axis.x)) { major = 1u; }
      if (abs(axis.z) > abs(axis[major])) { major = 2u; }
      axis *= safeSign(axis[major]);
      let tangent = normalize(cross(axis, select(vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0), abs(axis.y) > 0.9)));
      normal = tangent * safeSign(dot(a.position.xyz - b.position.xyz, axis));
    }
  }
  return Collision(normal, penetration, (pair.a + pair.b) * 0.5, 1u);
}
fn boxProjectionRadius(body: Body, axis: vec3<f32>) -> f32 {
  return abs(dot(boxAxis(body, 0u), axis)) * body.shape.x +
    abs(dot(boxAxis(body, 1u), axis)) * body.shape.y +
    abs(dot(boxAxis(body, 2u), axis)) * body.shape.z;
}
fn clippedFacePoint(reference: Body, incident: Body, faceAxis: u32,
                    outward: vec3<f32>) -> vec3<f32> {
  var incidentAxis = 0u;
  for (var k = 1u; k < 3u; k += 1u) {
    if (abs(dot(boxAxis(incident, k), outward)) >
        abs(dot(boxAxis(incident, incidentAxis), outward))) { incidentAxis = k; }
  }
  let center = incident.position.xyz - boxAxis(incident, incidentAxis) *
    safeSign(dot(boxAxis(incident, incidentAxis), outward)) * incident.shape[incidentAxis];
  let u = (incidentAxis + 1u) % 3u; let v = (incidentAxis + 2u) % 3u;
  let du = boxAxis(incident, u) * incident.shape[u];
  let dv = boxAxis(incident, v) * incident.shape[v];
  var polygon: array<vec3<f32>, 12>;
  polygon[0] = center - du - dv; polygon[1] = center + du - dv;
  polygon[2] = center + du + dv; polygon[3] = center - du + dv;
  var count = 4u;
  for (var k = 0u; k < 3u; k += 1u) {
    if (k == faceAxis) { continue; }
    for (var sign = -1; sign <= 1; sign += 2) {
      let side = boxAxis(reference, k) * f32(sign);
      let limit = dot(reference.position.xyz, side) + reference.shape[k];
      var clipped: array<vec3<f32>, 12>; var clippedCount = 0u;
      for (var j = 0u; j < count; j += 1u) {
        let p = polygon[j]; let q = polygon[(j + 1u) % count];
        let dp = dot(p, side) - limit; let dq = dot(q, side) - limit;
        if (dp <= 0.0) { clipped[clippedCount] = p; clippedCount += 1u; }
        if ((dp <= 0.0) != (dq <= 0.0)) {
          clipped[clippedCount] = p + (q - p) * dp / (dp - dq); clippedCount += 1u;
        }
      }
      polygon = clipped; count = clippedCount;
    }
  }
  let face = reference.position.xyz + outward * reference.shape[faceAxis];
  var contactPolygon: array<vec3<f32>, 12>; var points = 0u;
  for (var j = 0u; j < count; j += 1u) {
    let distance = dot(polygon[j] - face, outward);
    if (distance <= 0.004) {
      contactPolygon[points] = polygon[j] - outward * distance * 0.5; points += 1u;
    }
  }
  if (points == 0u) { return (supportPoint(reference, outward) + supportPoint(incident, -outward)) * 0.5; }
  // The contact patch centroid must be weighted by area. Vertex averaging
  // changes with duplicate clip vertices and biases aligned face contacts,
  // introducing artificial torque into a perfectly symmetric stack.
  var weighted = vec3<f32>(0.0); var areaSum = 0.0;
  for (var j = 1u; j + 1u < points; j += 1u) {
    let p0 = contactPolygon[0]; let p1 = contactPolygon[j]; let p2 = contactPolygon[j + 1u];
    let area = abs(dot(cross(p1 - p0, p2 - p0), outward));
    weighted += (p0 + p1 + p2) * (area / 3.0); areaSum += area;
  }
  if (areaSum > 1.0e-10) { return weighted / areaSum; }
  // A collapsed patch is an edge/point contact; its endpoints define its centre.
  var first = contactPolygon[0]; var last = first; var longest = 0.0;
  for (var j = 1u; j < points; j += 1u) {
    let distance = dot(contactPolygon[j] - first, contactPolygon[j] - first);
    if (distance > longest) { longest = distance; last = contactPolygon[j]; }
  }
  return (first + last) * 0.5;
}
fn boxEdge(body: Body, axis: u32, direction: vec3<f32>) -> Segment {
  var center = body.position.xyz;
  for (var k = 0u; k < 3u; k += 1u) {
    if (k != axis) { center += boxAxis(body, k) * safeSign(dot(boxAxis(body, k), direction)) * body.shape[k]; }
  }
  let edge = boxAxis(body, axis) * body.shape[axis];
  return Segment(center - edge, center + edge);
}
fn boxBox(a: Body, b: Body) -> Collision {
  let ax = boxAxis(a, 0u); let ay = boxAxis(a, 1u); let az = boxAxis(a, 2u);
  let bx = boxAxis(b, 0u); let by = boxAxis(b, 1u); let bz = boxAxis(b, 2u);
  var axes = array<vec3<f32>, 15>(ax, ay, az, bx, by, bz,
    cross(ax, bx), cross(ax, by), cross(ax, bz),
    cross(ay, bx), cross(ay, by), cross(ay, bz),
    cross(az, bx), cross(az, by), cross(az, bz));
  let delta = a.position.xyz - b.position.xyz;
  var bestDepth = 1.0e30; var bestNormal = vec3<f32>(0.0, 1.0, 0.0); var feature = 0u;
  for (var i = 0u; i < 15u; i += 1u) {
    let lengthSquared = dot(axes[i], axes[i]);
    if (lengthSquared < 1.0e-8) { continue; }
    let axis = axes[i] * inverseSqrt(lengthSquared);
    let depth = boxProjectionRadius(a, axis) + boxProjectionRadius(b, axis) -
      abs(dot(delta, axis));
    if (depth < -BOX_CONTACT_MARGIN) { return noCollision(); }
    let threshold = select(bestDepth * 0.95 - 0.001, bestDepth - 0.0001, i < 6u);
    if (depth < threshold) {
      bestDepth = depth; bestNormal = axis * safeSign(dot(delta, axis)); feature = i;
    }
  }
  var point = vec3<f32>(0.0);
  if (feature < 3u) { point = clippedFacePoint(a, b, feature, -bestNormal); }
  else if (feature < 6u) { point = clippedFacePoint(b, a, feature - 3u, bestNormal); }
  else {
    let ea = boxEdge(a, (feature - 6u) / 3u, -bestNormal);
    let eb = boxEdge(b, (feature - 6u) % 3u, bestNormal);
    let pair = closestSegmentPoints(ea.a, ea.b, eb.a, eb.b);
    point = (pair.a + pair.b) * 0.5;
  }
  return Collision(bestNormal, max(bestDepth, 0.0), point, 1u);
}
fn pointBoxDistanceSquared(point: vec3<f32>, box: Body) -> f32 {
  let local = inverseRotate(box.orientation, point - box.position.xyz);
  let delta = local - clamp(local, -box.shape.xyz, box.shape.xyz);
  return dot(delta, delta);
}
fn capsuleBox(capsule: Body, box: Body) -> Collision {
  let segment = capsuleSegment(capsule);
  var lo = 0.0; var hi = 1.0;
  for (var iteration = 0u; iteration < 8u; iteration += 1u) {
    let t0 = mix(lo, hi, 1.0 / 3.0); let t1 = mix(lo, hi, 2.0 / 3.0);
    let d0 = pointBoxDistanceSquared(mix(segment.a, segment.b, t0), box);
    let d1 = pointBoxDistanceSquared(mix(segment.a, segment.b, t1), box);
    if (d0 < d1) { hi = t1; } else { lo = t0; }
  }
  let segmentPoint = mix(segment.a, segment.b, (lo + hi) * 0.5);
  let local = inverseRotate(box.orientation, segmentPoint - box.position.xyz);
  var nearest = clamp(local, -box.shape.xyz, box.shape.xyz);
  let delta = local - nearest; let distance = length(delta);
  var localNormal = vec3<f32>(0.0); var penetration = 0.0;
  if (distance > EPS) {
    penetration = capsule.shape.x - distance;
    if (penetration <= 0.0) { return noCollision(); }
    localNormal = delta / distance;
  } else {
    let face = box.shape.xyz - abs(local);
    var axis = 0u; var depth = face.x;
    if (face.y < depth) { axis = 1u; depth = face.y; }
    if (face.z < depth) { axis = 2u; depth = face.z; }
    localNormal[axis] = safeSign(local[axis]);
    nearest[axis] = localNormal[axis] * box.shape[axis];
    penetration = capsule.shape.x + depth;
  }
  let normal = quatRotate(box.orientation, localNormal);
  return Collision(normal, penetration,
    box.position.xyz + quatRotate(box.orientation, nearest), 1u);
}
fn collide(a: Body, b: Body) -> Collision {
  let ta = a.flags.x; let tb = b.flags.x;
  if (ta == SHAPE_SPHERE && tb == SHAPE_SPHERE) { return sphereSphere(a, b); }
  if (ta == SHAPE_SPHERE && tb == SHAPE_BOX) { return sphereBox(a, b); }
  if (ta == SHAPE_BOX && tb == SHAPE_SPHERE) {
    let result = sphereBox(b, a);
    return Collision(-result.normal, result.penetration, result.point, result.hit);
  }
  if (ta == SHAPE_SPHERE && tb == SHAPE_CAPSULE) { return sphereCapsule(a, b); }
  if (ta == SHAPE_CAPSULE && tb == SHAPE_SPHERE) {
    let result = sphereCapsule(b, a);
    return Collision(-result.normal, result.penetration, result.point, result.hit);
  }
  if (ta == SHAPE_CAPSULE && tb == SHAPE_CAPSULE) { return capsuleCapsule(a, b); }
  if (ta == SHAPE_CAPSULE && tb == SHAPE_BOX) { return capsuleBox(a, b); }
  if (ta == SHAPE_BOX && tb == SHAPE_CAPSULE) {
    let result = capsuleBox(b, a);
    return Collision(-result.normal, result.penetration, result.point, result.hit);
  }
  return boxBox(a, b);
}
fn correctionFor(a: Body, b: Body, contact: Collision, dynamicB: bool,
                 id: u32, otherId: u32, boundary: bool) -> Correction {
  if (contact.hit == 0u || contact.penetration < 0.0) {
    return Correction(vec3<f32>(0.0), 0u, vec3<f32>(0.0), 0u,
      vec3<f32>(0.0), vec3<f32>(0.0));
  }
  let ra = contact.point - a.position.xyz;
  let torqueAxisA = cross(ra, contact.normal);
  let effectiveA = a.shape.w + dot(torqueAxisA, inverseInertia(a, torqueAxisA));
  var effectiveB = 0.0;
  if (dynamicB) {
    let rb = contact.point - b.position.xyz;
    let torqueAxisB = cross(rb, contact.normal);
    effectiveB = b.shape.w + dot(torqueAxisB, inverseInertia(b, torqueAxisB));
  }
  let lambda = contact.penetration / max(effectiveA + effectiveB, EPS);
  let impulse = contact.normal * lambda;
  let rb = contact.point - b.position.xyz;
  let va = a.velocity.xyz + cross(a.angularVelocity.xyz, ra);
  let vb = select(vec3<f32>(0.0), b.velocity.xyz + cross(b.angularVelocity.xyz, rb), dynamicB);
  let relative = va - vb;
  let normalSpeed = dot(relative, contact.normal);
  var slot = WARM_CONTACTS; var empty = WARM_CONTACTS;
  for (var k = 0u; k < WARM_CONTACTS; k += 1u) {
    let pair = warmBodies[id].contacts[k].pair;
    if (pair == otherId + 1u) { slot = k; break; }
    if (pair == 0u && empty == WARM_CONTACTS) { empty = k; }
  }
  if (slot == WARM_CONTACTS) { slot = empty; }
  var previous = WarmContact(vec4<f32>(0.0), vec3<f32>(0.0), 0u, vec3<f32>(0.0), 0u);
  if (slot < WARM_CONTACTS && warmBodies[id].contacts[slot].pair != 0u) {
    previous = warmBodies[id].contacts[slot];
  }
  let oldImpulse = previous.normalLambda.xyz * previous.normalLambda.w + previous.tangent;
  let oldArm = quatRotate(a.orientation, previous.localPoint);
  let anchorTolerance = 0.1 * min(a.shape.x, min(a.shape.y, a.shape.z));
  let matches = previous.pair != 0u && dot(previous.normalLambda.xyz, contact.normal) > 0.95 &&
    length(ra - oldArm) <= max(anchorTolerance, 0.001);
  let degree = max(1u, max(a.flags.z & CONTACT_MASK, b.flags.z & CONTACT_MASK));
  let relaxation = select(params.correction / f32(degree), 1.0, boundary);
  let normalLambda = max(0.0, select(0.0, previous.normalLambda.w, matches) -
    relaxation * normalSpeed / max(effectiveA + effectiveB, EPS));
  var tangentImpulse = select(vec3<f32>(0.0), previous.tangent -
    contact.normal * dot(previous.tangent, contact.normal), matches);
  let tangent = relative - contact.normal * normalSpeed;
  let tangentSpeed = length(tangent);
  if (tangentSpeed > EPS && normalLambda > 0.0) {
    let direction = tangent / tangentSpeed;
    let ta = cross(ra, direction); let tb = cross(rb, direction);
    let tangentMassA = a.shape.w + dot(ta, inverseInertia(a, ta));
    let tangentMassB = select(0.0, b.shape.w + dot(tb, inverseInertia(b, tb)), dynamicB);
    tangentImpulse -= direction * (relaxation * tangentSpeed / max(tangentMassA + tangentMassB, EPS));
  }
  let tangentLength = length(tangentImpulse);
  if (tangentLength > 0.65 * normalLambda) {
    tangentImpulse *= 0.65 * normalLambda / max(tangentLength, EPS);
  }
  let velocityImpulse = contact.normal * normalLambda + tangentImpulse - oldImpulse;
  if (slot < WARM_CONTACTS) {
    warmBodies[id].contacts[slot] = WarmContact(vec4<f32>(contact.normal, normalLambda),
      tangentImpulse, otherId + 1u, inverseRotate(a.orientation, ra), 1u);
  } else {
    // Solve excess contacts cold and report the bounded cache overflow.
    atomicAdd(&counters.cacheOverflow, 1u);
  }
  return Correction(impulse * a.shape.w,
    select(0u, 1u, contact.normal.y > 0.55),
    inverseInertia(a, cross(ra, impulse)), 1u,
    velocityImpulse * a.shape.w, inverseInertia(a,
      cross(ra, contact.normal * normalLambda + tangentImpulse) - cross(oldArm, oldImpulse)));
}

@compute @workgroup_size(256)
fn clearGrid(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x < params.cellCount) { atomicStore(&cellHead[gid.x], INVALID_BODY); }
}
@compute @workgroup_size(256)
fn clearCounters(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x == 0u) {
    atomicStore(&counters.awake, 0u); atomicStore(&counters.contacting, 0u);
  atomicStore(&counters.maxCellChain, 0u);
  atomicStore(&counters.cacheOverflow, 0u);
  }
}
@compute @workgroup_size(256)
fn predictBodies(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= params.bodyCount) { return; }
  var body = snapshot[id];
  if (isAwake(body) && body.shape.w > 0.0) {
    body.velocity.y += params.gravity * params.dt;
    // Warm-start the actual accumulated unilateral/Coulomb impulses, retaining
    // their pair identity. The immutable snapshot prevents cross-thread races.
    for (var k = 0u; k < WARM_CONTACTS; k += 1u) {
      var cached = warmBodies[id].contacts[k];
      if (cached.pair == 0u) { continue; }
      let otherId = cached.pair - 1u;
      var contact = noCollision();
      if (otherId == params.bodyCount) {
        let point = supportPoint(body, vec3<f32>(0.0, -1.0, 0.0));
        if (point.y <= FLOOR_CONTACT_MARGIN) {
          contact = Collision(vec3<f32>(0.0, 1.0, 0.0), max(0.0, -point.y), point, 1u);
        }
      } else if (otherId < params.bodyCount) {
        contact = collide(body, snapshot[otherId]);
      }
      let localPoint = inverseRotate(body.orientation, contact.point - body.position.xyz);
      let anchorTolerance = 0.1 * min(body.shape.x, min(body.shape.y, body.shape.z));
      if (contact.hit == 0u || dot(contact.normal, cached.normalLambda.xyz) < 0.95 ||
          length(localPoint - cached.localPoint) > max(anchorTolerance, 0.001)) {
        warmBodies[id].contacts[k].pair = 0u;
        warmBodies[id].contacts[k].normalLambda = vec4<f32>(0.0);
        warmBodies[id].contacts[k].tangent = vec3<f32>(0.0);
        continue;
      }
      let warmDecay = exp(-2.4 * params.dt);
      cached.normalLambda = vec4<f32>(contact.normal, cached.normalLambda.w * warmDecay);
      cached.tangent = (cached.tangent - contact.normal * dot(cached.tangent, contact.normal)) * warmDecay;
      cached.localPoint = localPoint;
      let impulse = cached.normalLambda.xyz * cached.normalLambda.w + cached.tangent;
      body.velocity.xyz += impulse * body.shape.w;
      body.angularVelocity.xyz += inverseInertia(body, cross(contact.point - body.position.xyz, impulse));
      warmBodies[id].contacts[k] = cached;
    }
    body.velocity.xyz *= exp(-0.35 * params.dt);
    body.angularVelocity.xyz *= exp(-0.55 * params.dt);
    body.position.xyz += body.velocity.xyz * params.dt;
    body.orientation = integrateOrientation(body.orientation,
      body.angularVelocity.xyz, params.dt);
  }
  bodies[id] = body;
}
@compute @workgroup_size(256)
fn buildGrid(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= params.bodyCount) { return; }
  let cell = gridIndex(gridCoord(bodies[id].position.xyz));
  nextBody[id] = atomicExchange(&cellHead[cell], id);
}

@compute @workgroup_size(256)
fn wakeBodies(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id == 0u || id >= params.bodyCount || isAwake(snapshot[id]) || snapshot[id].shape.w <= 0.0) { return; }
  var body = snapshot[id];
  let center = gridCoord(body.position.xyz);
  var wake = false;
  var hasSupport = supportPoint(body, vec3<f32>(0.0, -1.0, 0.0)).y <= 0.012;
  let projectile = snapshot[0];
  if (aabbMayOverlap(body, projectile, 0.02)) {
    let projectileContact = collide(body, projectile);
    wake = projectileContact.hit != 0u && projectileContact.penetration > 0.0;
  }
  var chainMax = 0u;
  for (var dz = -1; dz <= 1; dz += 1) {
    for (var dy = -1; dy <= 1; dy += 1) {
      for (var dx = -1; dx <= 1; dx += 1) {
        let c = vec3<i32>(center) + vec3<i32>(dx, dy, dz);
        if (any(c < vec3<i32>(0)) || c.x >= i32(params.gridX) ||
            c.y >= i32(params.gridY) || c.z >= i32(params.gridZ)) { continue; }
        var otherId = atomicLoad(&cellHead[gridIndex(vec3<u32>(c))]);
        var chain = 0u;
        loop {
          if (otherId == INVALID_BODY || chain >= 64u) { break; }
          if (otherId != id && otherId != 0u) {
            let other = snapshot[otherId];
            let selfExtent = worldHalfExtent(body);
            let otherExtent = worldHalfExtent(other);
            let selfBottom = body.position.y - selfExtent.y;
            let otherTop = other.position.y + otherExtent.y;
            let horizontal = abs(body.position.x - other.position.x) <=
                selfExtent.x + otherExtent.x + 0.01 &&
              abs(body.position.z - other.position.z) <=
                selfExtent.z + otherExtent.z + 0.01;
            hasSupport = hasSupport || (horizontal && other.position.y < body.position.y &&
              otherTop >= selfBottom - 0.016 && otherTop <= selfBottom + 0.024);
            let energeticNeighbor = length(other.velocity.xyz) > 0.45 ||
              length(other.angularVelocity.xyz) > 1.2;
            if (isAwake(other) && energeticNeighbor && aabbMayOverlap(body, other, 0.02)) {
              let contact = collide(body, other);
              let contactSpeed = dot(other.velocity.xyz + cross(other.angularVelocity.xyz,
                contact.point - other.position.xyz), contact.normal);
              // Wake for compression at the contact, not arbitrary motion on
              // another face. Tangential/retreating debris must not wake a wall.
              wake = wake || (contact.hit != 0u &&
                (contactSpeed > 0.45 || contact.penetration > 0.025));
            }
          }
          otherId = nextBody[otherId]; chain += 1u;
        }
        chainMax = max(chainMax, chain);
      }
    }
  }
  if (wake || !hasSupport) {
    body.flags.y = 1u;
    body.flags.w = 0u;
    bodies[id] = body;
  }
  atomicMax(&counters.maxCellChain, chainMax);
}

@compute @workgroup_size(256)
fn solveBodies(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= params.bodyCount) { return; }
  var body = snapshot[id];
  if (body.shape.w <= 0.0) { return; }
  let center = gridCoord(body.position.xyz);
  let wake = isAwake(body) || id == 0u;
  var chainMax = 0u;
  if (!wake) { return; }
  for (var k = 0u; k < WARM_CONTACTS; k += 1u) { warmBodies[id].contacts[k].seen = 0u; }

  var linear = vec3<f32>(0.0); var angular = vec3<f32>(0.0);
  var velocity = vec3<f32>(0.0); var angularVelocity = vec3<f32>(0.0);
  var contacts = 0u; var supported = false;
  if (wake) {
    if (id != 0u) {
      let projectile = snapshot[0];
      if (aabbMayOverlap(body, projectile, 0.02)) {
        let contribution = correctionFor(body, projectile,
          collide(body, projectile), isAwake(projectile), id, 0u, false);
        linear += contribution.linear; angular += contribution.angular;
        velocity += contribution.velocity; angularVelocity += contribution.angularVelocity;
        contacts += contribution.hit; supported = supported || contribution.supported != 0u;
      }
    }
      // The projectile is larger than a grid cell. Search its complete AABB
      // plus the maximum brick extent, and solve the reciprocal contact too.
      let radius = select(vec3<i32>(1),
        vec3<i32>(ceil((worldHalfExtent(body) + vec3<f32>(0.245)) / params.cellSize)), id == 0u);
      for (var dz = -radius.z; dz <= radius.z; dz += 1) {
        for (var dy = -radius.y; dy <= radius.y; dy += 1) {
          for (var dx = -radius.x; dx <= radius.x; dx += 1) {
            let c = vec3<i32>(center) + vec3<i32>(dx, dy, dz);
            if (any(c < vec3<i32>(0)) || c.x >= i32(params.gridX) ||
                c.y >= i32(params.gridY) || c.z >= i32(params.gridZ)) { continue; }
            var otherId = atomicLoad(&cellHead[gridIndex(vec3<u32>(c))]);
            var chain = 0u;
            loop {
              if (otherId == INVALID_BODY || chain >= 64u) { break; }
              if (otherId != id && otherId != 0u) {
                let other = snapshot[otherId];
                if (aabbMayOverlap(body, other, 0.01)) {
                  let contribution = correctionFor(body, other,
                    collide(body, other), isAwake(other), id, otherId, false);
                  linear += contribution.linear; angular += contribution.angular;
                  velocity += contribution.velocity; angularVelocity += contribution.angularVelocity;
                  contacts += contribution.hit;
                  supported = supported || contribution.supported != 0u;
                }
              }
              otherId = nextBody[otherId]; chain += 1u;
            }
            chainMax = max(chainMax, chain);
          }
        }
      }
    if (contacts > 0u) {
      let scale = params.correction / f32(contacts);
      body.position.xyz += linear * scale;
      body.orientation = applyAngularCorrection(body.orientation, angular * scale);
      // Split impulses: penetration repair changes the pose, while collision
      // impulses change velocity. Reconstructing velocity from repaired poses
      // injects energy and propagates an artificial explosion through stacks.
      body.velocity.xyz += velocity;
      body.angularVelocity.xyz += angularVelocity;
    }
    // Project the infinite-mass boundary after the relaxed Jacobi body contacts.
    // Averaging it into those contacts weakens the floor as stack load grows.
    // Translation repairs overlap without injecting velocity; the physical
    // contact impulse still includes angular effective mass and Coulomb friction.
    let floorPoint = supportPoint(body, vec3<f32>(0.0, -1.0, 0.0));
    let floorDepth = max(0.0, -floorPoint.y);
    if (floorPoint.y <= FLOOR_CONTACT_MARGIN) {
      let floorBody = Body(vec4<f32>(0.0), vec4<f32>(0.0), vec4<f32>(0.0),
        vec4<f32>(0.0, 0.0, 0.0, 1.0), vec4<f32>(0.0), vec4<u32>(0u));
      let floorContact = Collision(vec3<f32>(0.0, 1.0, 0.0), floorDepth, floorPoint, 1u);
      let contribution = correctionFor(body, floorBody, floorContact, false, id, params.bodyCount, true);
      body.position.y += floorDepth;
      body.velocity.xyz += contribution.velocity;
      body.angularVelocity.xyz += contribution.angularVelocity;
      contacts += 1u; supported = true;
    }
    // Release warm impulses if a contact disappeared after prediction/repair.
    for (var k = 0u; k < WARM_CONTACTS; k += 1u) {
      let cached = warmBodies[id].contacts[k];
      if (cached.pair != 0u && cached.seen == 0u) {
        let impulse = cached.normalLambda.xyz * cached.normalLambda.w + cached.tangent;
        body.velocity.xyz -= impulse * body.shape.w;
        body.angularVelocity.xyz -= inverseInertia(body,
          cross(quatRotate(body.orientation, cached.localPoint), impulse));
        warmBodies[id].contacts[k] = WarmContact(vec4<f32>(0.0), vec3<f32>(0.0), 0u, vec3<f32>(0.0), 0u);
      }
    }
    body.flags.y = 1u;
    body.flags.z = contacts | select(0u, SUPPORT_BIT, supported);
  }
  bodies[id] = body;
  atomicMax(&counters.maxCellChain, chainMax);
}

@compute @workgroup_size(256)
fn finalizeBodies(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= params.bodyCount) { return; }
  var body = bodies[id];
  if (!isAwake(body) || body.shape.w <= 0.0) { return; }
  let contactCount = body.flags.z & CONTACT_MASK;
  let speed = length(body.velocity.xyz);
  let angularSpeed = length(body.angularVelocity.xyz);
  var sleepFrames = body.flags.w;
  if (id != 0u && contactCount > 0u && speed < 0.035 && angularSpeed < 0.07) {
    sleepFrames += 1u; body.flags.w = sleepFrames;
    if (sleepFrames > 90u) {
      body.flags.y = 0u; body.velocity = vec4<f32>(0.0);
      body.angularVelocity = vec4<f32>(0.0);
      for (var k = 0u; k < WARM_CONTACTS; k += 1u) {
        warmBodies[id].contacts[k] = WarmContact(vec4<f32>(0.0), vec3<f32>(0.0), 0u, vec3<f32>(0.0), 0u);
      }
    }
  } else { body.flags.w = 0u; }
  bodies[id] = body;
}

@compute @workgroup_size(256)
fn countState(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= params.bodyCount) { return; }
  let body = bodies[id];
  if (isAwake(body)) { atomicAdd(&counters.awake, 1u); }
  if ((body.flags.z & CONTACT_MASK) > 0u) { atomicAdd(&counters.contacting, 1u); }
}
