/*
  avbd.wgsl
  Compact WebGPU AVBD demo solver.

  This shader keeps the compute stage inside the baseline WebGPU storage-buffer
  limit by packing body state into one structured buffer:

    bodies      read/write Body array
    dynOffsets  read-only neighbor offsets
    dynNeighbors read-only neighbor indices
    warmStart   read/write lambda/stiffness

  The demo uses active fixed boxes as colliders, active dynamic boxes/spheres as
  simulated bodies, and inactive projectile slots as empty budget entries.
*/

const SHAPE_SPHERE : u32 = 0u;
const SHAPE_BOX : u32 = 1u;
const SHAPE_TRIANGLE : u32 = 2u;
const SHAPE_CAPSULE : u32 = 3u;
const SHAPE_CYLINDER : u32 = 4u;
const SHAPE_TRIANGLE_MESH : u32 = 5u;
const BODY_ACTIVE : u32 = 1u;
const NO_HIT_PEN : f32 = 1.0e30;
const EPS : f32 = 1.0e-6;

struct Body {
  pos: vec4<f32>,
  vel: vec4<f32>,
  accelMass: vec4<f32>,
  shapeParam: vec4<f32>,
  aux: vec4<u32>,
}

struct Collision {
  penetration: f32,
  normal: vec3<f32>,
  hit: u32,
}

struct SegmentPair {
  a: vec3<f32>,
  b: vec3<f32>,
}

struct Params {
  dt: f32,
  beta: f32,
  lamMin: f32,
  lamMax: f32,

  bodyCount: u32,
  neighborCount: u32,
  _padA: u32,
  _padB: u32,

  worldMin: vec4<f32>,
  worldMax: vec4<f32>,
  globalAccel: vec4<f32>,

  damping: f32,
  kStart: f32,
  kMax: f32,
  lambdaDecay: f32,

  stiffnessDecay: f32,
  contactSlop: f32,
  iterations: u32,
  _padC: u32,
}

@group(0) @binding(0) var<storage, read_write> bodies : array<Body>;
@group(0) @binding(1) var<storage, read> dynOffsets : array<u32>;
@group(0) @binding(2) var<storage, read> dynNeighbors : array<u32>;
@group(0) @binding(3) var<storage, read_write> warmStart : array<vec4<f32>>;
@group(0) @binding(4) var<uniform> params : Params;
@group(0) @binding(5) var<storage, read> snapshot : array<Body>;
struct Prediction { old: vec4<f32>, inertial: vec4<f32> }
@group(0) @binding(6) var<storage, read_write> prediction : array<Prediction>;

fn noCollision() -> Collision {
  return Collision(NO_HIT_PEN, vec3<f32>(0.0, 0.0, 0.0), 0u);
}

fn better(a: Collision, b: Collision) -> Collision {
  if (b.hit != 0u && b.penetration < a.penetration) {
    return b;
  }
  return a;
}

fn safeSign(v: f32) -> f32 {
  if (v < 0.0) {
    return -1.0;
  }
  return 1.0;
}

fn safeNormal(v: vec3<f32>) -> vec3<f32> {
  let l = length(v);
  if (l > EPS) {
    return v / l;
  }
  return vec3<f32>(1.0, 0.0, 0.0);
}

fn isActive(i: u32) -> bool {
  return (snapshot[i].aux.y & BODY_ACTIVE) != 0u;
}

fn shapeTypeOf(i: u32) -> u32 {
  return snapshot[i].aux.x;
}

fn shapeRadius(i: u32) -> f32 {
  let t = shapeTypeOf(i);
  let p = snapshot[i].shapeParam;
  if (t == SHAPE_BOX || t == SHAPE_TRIANGLE || t == SHAPE_TRIANGLE_MESH) {
    return length(p.xyz);
  }
  if (t == SHAPE_SPHERE) {
    return p.x;
  }
  if (t == SHAPE_CAPSULE || t == SHAPE_CYLINDER) {
    return p.x + p.y;
  }
  return 0.0;
}

fn capsuleAxis(p: vec4<f32>) -> vec3<f32> {
  if (p.z < 0.5) {
    return vec3<f32>(1.0, 0.0, 0.0);
  }
  if (p.z < 1.5) {
    return vec3<f32>(0.0, 1.0, 0.0);
  }
  return vec3<f32>(0.0, 0.0, 1.0);
}

fn capsuleHalfExtent(p: vec4<f32>) -> vec3<f32> {
  let r = max(p.x, EPS);
  let h = max(p.y, 0.0);
  return vec3<f32>(r, r, r) + capsuleAxis(p) * h;
}

fn cylinderHalfExtent(p: vec4<f32>) -> vec3<f32> {
  let r = max(p.x, EPS);
  let h = max(p.y, EPS);
  let a = capsuleAxis(p);
  return vec3<f32>(r, r, r) + a * (h - r);
}

fn shapeWorldHalfExtent(i: u32) -> vec3<f32> {
  let t = shapeTypeOf(i);
  let p = snapshot[i].shapeParam;
  if (t == SHAPE_BOX || t == SHAPE_TRIANGLE || t == SHAPE_TRIANGLE_MESH) {
    return max(p.xyz, vec3<f32>(EPS, EPS, EPS));
  }
  if (t == SHAPE_SPHERE) {
    return vec3<f32>(p.x, p.x, p.x);
  }
  if (t == SHAPE_CAPSULE) {
    return capsuleHalfExtent(p);
  }
  if (t == SHAPE_CYLINDER) {
    return max(cylinderHalfExtent(p), vec3<f32>(EPS, EPS, EPS));
  }
  return vec3<f32>(EPS, EPS, EPS);
}

fn collideSphereSphere(c0: vec3<f32>, r0: f32, c1: vec3<f32>, r1: f32) -> Collision {
  let d = c0 - c1;
  let dist = length(d);
  let pen = dist - (r0 + r1);
  return Collision(pen, safeNormal(d), 1u);
}


fn closestPointOnSegment(p: vec3<f32>, a: vec3<f32>, b: vec3<f32>) -> vec3<f32> {
  let ab = b - a;
  let denom = max(dot(ab, ab), EPS);
  let t = clamp(dot(p - a, ab) / denom, 0.0, 1.0);
  return a + ab * t;
}

fn collideSphereCapsule(sc: vec3<f32>, sr: f32, cc: vec3<f32>, cp: vec4<f32>) -> Collision {
  let axis = capsuleAxis(cp);
  let half = max(cp.y, 0.0);
  let a = cc - axis * half;
  let b = cc + axis * half;
  let q = closestPointOnSegment(sc, a, b);
  return collideSphereSphere(sc, sr, q, max(cp.x, EPS));
}

fn closestSegmentPoints(a0: vec3<f32>, a1: vec3<f32>, b0: vec3<f32>, b1: vec3<f32>) -> SegmentPair {
  let d1 = a1 - a0;
  let d2 = b1 - b0;
  let r = a0 - b0;
  let a = dot(d1, d1);
  let e = dot(d2, d2);
  let f = dot(d2, r);
  var s = 0.0;
  var t = 0.0;

  if (a <= EPS && e <= EPS) {
    return SegmentPair(a0, b0);
  }
  if (a <= EPS) {
    s = 0.0;
    t = clamp(f / max(e, EPS), 0.0, 1.0);
  } else {
    let c = dot(d1, r);
    if (e <= EPS) {
      t = 0.0;
      s = clamp(-c / max(a, EPS), 0.0, 1.0);
    } else {
      let b = dot(d1, d2);
      let denom = a * e - b * b;
      if (denom != 0.0) {
        s = clamp((b * f - c * e) / denom, 0.0, 1.0);
      }
      t = (b * s + f) / e;
      if (t < 0.0) {
        t = 0.0;
        s = clamp(-c / max(a, EPS), 0.0, 1.0);
      } else if (t > 1.0) {
        t = 1.0;
        s = clamp((b - c) / max(a, EPS), 0.0, 1.0);
      }
    }
  }
  return SegmentPair(a0 + d1 * s, b0 + d2 * t);
}

fn collideCapsuleCapsule(c0: vec3<f32>, p0: vec4<f32>, c1: vec3<f32>, p1: vec4<f32>) -> Collision {
  let a0 = c0 - capsuleAxis(p0) * max(p0.y, 0.0);
  let a1 = c0 + capsuleAxis(p0) * max(p0.y, 0.0);
  let b0 = c1 - capsuleAxis(p1) * max(p1.y, 0.0);
  let b1 = c1 + capsuleAxis(p1) * max(p1.y, 0.0);
  let pair = closestSegmentPoints(a0, a1, b0, b1);
  return collideSphereSphere(pair.a, max(p0.x, EPS), pair.b, max(p1.x, EPS));
}

fn collideBoxBox(c0: vec3<f32>, h0: vec3<f32>, c1: vec3<f32>, h1: vec3<f32>) -> Collision {
  let d = c0 - c1;
  let overlap = h0 + h1 - abs(d);

  var axis = 0u;
  var minOverlap = overlap.x;
  if (overlap.y < minOverlap) {
    axis = 1u;
    minOverlap = overlap.y;
  }
  if (overlap.z < minOverlap) {
    axis = 2u;
    minOverlap = overlap.z;
  }

  var n = vec3<f32>(safeSign(d.x), 0.0, 0.0);
  if (axis == 1u) {
    n = vec3<f32>(0.0, safeSign(d.y), 0.0);
  }
  if (axis == 2u) {
    n = vec3<f32>(0.0, 0.0, safeSign(d.z));
  }
  return Collision(-minOverlap, n, 1u);
}

fn collideSphereBox(sc: vec3<f32>, sr: f32, bc: vec3<f32>, bh: vec3<f32>) -> Collision {
  let local = sc - bc;
  let nearest = clamp(local, -bh, bh);
  let diff = local - nearest;
  let dist = length(diff);
  if (dist > EPS) {
    let pen = dist - sr;
    return Collision(pen, diff / dist, 1u);
  }

  let face = bh - abs(local);
  var axis = 0u;
  var minFace = face.x;
  if (face.y < minFace) {
    axis = 1u;
    minFace = face.y;
  }
  if (face.z < minFace) {
    axis = 2u;
    minFace = face.z;
  }

  var n = vec3<f32>(safeSign(local.x), 0.0, 0.0);
  if (axis == 1u) {
    n = vec3<f32>(0.0, safeSign(local.y), 0.0);
  }
  if (axis == 2u) {
    n = vec3<f32>(0.0, 0.0, safeSign(local.z));
  }
  return Collision(-(minFace + sr), n, 1u);
}

fn collideShapesRaw(i0: u32, p0: vec3<f32>, i1: u32, p1: vec3<f32>) -> Collision {
  let t0 = shapeTypeOf(i0);
  let t1 = shapeTypeOf(i1);
  let s0 = snapshot[i0].shapeParam;
  let s1 = snapshot[i1].shapeParam;

  if (t0 == SHAPE_SPHERE && t1 == SHAPE_SPHERE) {
    return collideSphereSphere(p0, s0.x, p1, s1.x);
  }
  if (t0 == SHAPE_SPHERE && t1 == SHAPE_BOX) {
    return collideSphereBox(p0, s0.x, p1, s1.xyz);
  }
  if (t0 == SHAPE_BOX && t1 == SHAPE_SPHERE) {
    let c = collideSphereBox(p1, s1.x, p0, s0.xyz);
    return Collision(c.penetration, -c.normal, c.hit);
  }
  if (t0 == SHAPE_CAPSULE && t1 == SHAPE_CAPSULE) {
    return collideCapsuleCapsule(p0, s0, p1, s1);
  }
  if (t0 == SHAPE_SPHERE && t1 == SHAPE_CAPSULE) {
    return collideSphereCapsule(p0, s0.x, p1, s1);
  }
  if (t0 == SHAPE_CAPSULE && t1 == SHAPE_SPHERE) {
    let c = collideSphereCapsule(p1, s1.x, p0, s0);
    return Collision(c.penetration, -c.normal, c.hit);
  }
  if (t0 == SHAPE_BOX && t1 == SHAPE_CAPSULE) {
    return collideBoxBox(p0, s0.xyz, p1, capsuleHalfExtent(s1));
  }
  if (t0 == SHAPE_CAPSULE && t1 == SHAPE_BOX) {
    return collideBoxBox(p0, capsuleHalfExtent(s0), p1, s1.xyz);
  }
  if (t0 == SHAPE_BOX && t1 == SHAPE_BOX) {
    return collideBoxBox(p0, s0.xyz, p1, s1.xyz);
  }
  if ((t0 == SHAPE_CYLINDER || t0 == SHAPE_TRIANGLE || t0 == SHAPE_TRIANGLE_MESH) ||
      (t1 == SHAPE_CYLINDER || t1 == SHAPE_TRIANGLE || t1 == SHAPE_TRIANGLE_MESH)) {
    return collideBoxBox(p0, shapeWorldHalfExtent(i0), p1, shapeWorldHalfExtent(i1));
  }
  return noCollision();
}

fn collideShapes(i0:u32,p0:vec3<f32>,i1:u32,p1:vec3<f32>)->Collision {
  var c=collideShapesRaw(i0,p0,i1,p1);
  if(length(p0-p1)<EPS) {c.normal=abs(c.normal)*select(1.0,-1.0,i0<i1);}
  return c;
}

fn contactStiffness(id:u32,other:u32)->f32 {
  var mass=snapshot[id].accelMass.w;
  if(other<params.bodyCount && snapshot[other].accelMass.w>0.0) {
    let otherMass=snapshot[other].accelMass.w;
    mass=mass*otherMass/(mass+otherMass);
  }
  let dt=max(params.dt,EPS);
  return max(params.kStart,min(params.kMax,mass/(dt*dt)*10.0));
}

fn queryWorld(p: vec3<f32>, halfExtent: vec3<f32>) -> Collision {
  var best = noCollision();

  let minX = p.x - halfExtent.x - params.worldMin.x;
  if (minX < 0.0) {
    best = better(best, Collision(minX, vec3<f32>(1.0, 0.0, 0.0), 1u));
  }
  let minY = p.y - halfExtent.y - params.worldMin.y;
  if (minY < 0.0) {
    best = better(best, Collision(minY, vec3<f32>(0.0, 1.0, 0.0), 1u));
  }
  let minZ = p.z - halfExtent.z - params.worldMin.z;
  if (minZ < 0.0) {
    best = better(best, Collision(minZ, vec3<f32>(0.0, 0.0, 1.0), 1u));
  }

  let maxX = params.worldMax.x - (p.x + halfExtent.x);
  if (maxX < 0.0) {
    best = better(best, Collision(maxX, vec3<f32>(-1.0, 0.0, 0.0), 1u));
  }
  let maxY = params.worldMax.y - (p.y + halfExtent.y);
  if (maxY < 0.0) {
    best = better(best, Collision(maxY, vec3<f32>(0.0, -1.0, 0.0), 1u));
  }
  let maxZ = params.worldMax.z - (p.z + halfExtent.z);
  if (maxZ < 0.0) {
    best = better(best, Collision(maxZ, vec3<f32>(0.0, 0.0, -1.0), 1u));
  }

  return best;
}

fn findBestCollision(id: u32, x: vec3<f32>) -> Collision {
  var best = queryWorld(x, shapeWorldHalfExtent(id));

  let o0 = dynOffsets[id];
  let o1 = dynOffsets[id + 1u];
  let end = min(o1, params.neighborCount);
  for (var idx = o0; idx < end; idx += 1u) {
    let j = dynNeighbors[idx];
    if (j >= params.bodyCount || j == id || !isActive(j)) {
      continue;
    }
    best = better(best, collideShapes(id, x, j, snapshot[j].pos.xyz));
  }

  return best;
}

// Prediction is separate from the globally synchronized primal iterations.
@compute @workgroup_size(64)
fn predictBodies(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id=gid.x; if(id>=params.bodyCount) { return; }
  var body=snapshot[id];
  let old=body.pos.xyz;
  if(isActive(id) && body.accelMass.w>0.0) {
    let dt=max(params.dt,EPS);
    body.vel=vec4<f32>((body.vel.xyz+dt*(body.accelMass.xyz+params.globalAccel.xyz))*pow(params.damping,dt*60.0),0.0);
    body.pos=vec4<f32>(old+dt*body.vel.xyz,1.0);
  } else { body.vel=vec4<f32>(0.0); }
  prediction[id]=Prediction(vec4<f32>(old,1.0),body.pos);
  bodies[id]=body;
  // Duals belong to a contact, never to the deepest collision of a body.
  for(var edge=dynOffsets[id];edge<min(dynOffsets[id+1u],params.neighborCount);edge++) { warmStart[edge]=vec4<f32>(0.0); }
  for(var side=0u;side<6u;side++) { warmStart[params.neighborCount+id*6u+side]=vec4<f32>(0.0); }
}

fn worldContact(id:u32,x:vec3<f32>,side:u32)->Collision {
  let axis=side/2u; let h=shapeWorldHalfExtent(id);
  var n=vec3<f32>(0.0);n[axis]=select(-1.0,1.0,side%2u==0u);
  let gap=select(params.worldMax[axis]-x[axis]-h[axis],x[axis]-h[axis]-params.worldMin[axis],side%2u==0u);
  return Collision(gap,n,1u);
}

@compute @workgroup_size(64)
fn avbdMultiShape(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id=gid.x;if(id>=params.bodyCount) { return; }
  let body=snapshot[id];
  if(!isActive(id)||body.accelMass.w<=0.0) { bodies[id]=body;return; }
  let dt=max(params.dt,EPS);let mass=body.accelMass.w;
  let inertia=mass/(dt*dt);let x=body.pos.xyz;
  var force=inertia*(prediction[id].inertial.xyz-x);
  var hessian=mat3x3<f32>(vec3<f32>(inertia,0,0),vec3<f32>(0,inertia,0),vec3<f32>(0,0,inertia));
  let start=dynOffsets[id];let end=min(dynOffsets[id+1u],params.neighborCount);
  for(var index=start;index<end+6u;index++) {
    var c=noCollision();var slot=index;var other=params.bodyCount;
    if(index<end) {
      let j=dynNeighbors[index];if(j>=params.bodyCount||j==id||!isActive(j)) { continue; }
      other=j;c=collideShapes(id,x,j,snapshot[j].pos.xyz);
    } else { let side=index-end;slot=params.neighborCount+id*6u+side;c=worldContact(id,x,side); }
    if(c.hit==0u) { continue; }
    let k=contactStiffness(id,other);
    let gap=c.penetration+params.contactSlop;
    let lambda=min(0.0,warmStart[slot].x+k*gap);
    if(lambda>=0.0) { continue; }
    let n=c.normal;
    force-=lambda*n;
    hessian+=mat3x3<f32>(k*n*n.x,k*n*n.y,k*n*n.z);
  }
  // Symmetric 3x3 solve preserves unconstrained tangential motion.
  let r0=cross(hessian[1],hessian[2]);
  let r1=cross(hessian[2],hessian[0]);
  let r2=cross(hessian[0],hessian[1]);
  let determinant=max(dot(hessian[0],r0),EPS);
  let delta=vec3<f32>(dot(r0,force),dot(r1,force),dot(r2,force))/determinant;
  // Weighted Jacobi moves both endpoints of a dynamic pair concurrently.
  // A half step is the non-overshooting relaxation limit for that case.
  let next=x+0.5*delta;
  bodies[id]=body;
  bodies[id].pos=vec4<f32>(next,1.0);
  bodies[id].vel=vec4<f32>((next-prediction[id].old.xyz)/dt,0.0);
}

// Update duals only after every body's primal position is visible. Updating
// them from pre-solve penetrations double-counts corrections in Jacobi pairs.
@compute @workgroup_size(64)
fn updateContactDuals(@builtin(global_invocation_id) gid:vec3<u32>) {
  let id=gid.x;if(id>=params.bodyCount||!isActive(id)) {return;}
  let mass=snapshot[id].accelMass.w;if(mass<=0.0){return;}
  let dt=max(params.dt,EPS);
  let start=dynOffsets[id];let end=min(dynOffsets[id+1u],params.neighborCount);
  for(var index=start;index<end+6u;index++) {
    var c=noCollision();var slot=index;var other=params.bodyCount;
    if(index<end) {
      let j=dynNeighbors[index];if(j>=params.bodyCount||j==id||!isActive(j)){continue;}
      other=j;c=collideShapes(id,snapshot[id].pos.xyz,j,snapshot[j].pos.xyz);
    } else {
      let side=index-end;slot=params.neighborCount+id*6u+side;
      c=worldContact(id,snapshot[id].pos.xyz,side);
    }
    if(c.hit==0u){warmStart[slot]=vec4<f32>(0.0);continue;}
    let k=contactStiffness(id,other);
    warmStart[slot]=vec4<f32>(min(0.0,warmStart[slot].x+k*(c.penetration+params.contactSlop)),k,0,0);
  }
}

