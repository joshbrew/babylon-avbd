/** Relative-motion manifold reuse, inspired by Erin Catto's Contact Recycling:
 * https://box2d.org/posts/2026/10/contact-recycling/
 * AVBD retains its local anchors and refreshes C(x-) from live poses. Rounded
 * shapes use fresh geometry, and absolute rotation limits bound normal error.
 */
export function contactRecyclingOptions(value = false) {
  if (value === false) return false;
  if (
    value !== true &&
    (!value || typeof value !== "object" || Array.isArray(value))
  )
    throw Error("contactRecycling must be a boolean or options object");
  const { distance = 0.01, maxAngle = 0.01 } = value === true ? {} : value;
  if (
    typeof distance !== "number" ||
    !Number.isFinite(Math.fround(distance)) ||
    Math.fround(distance) <= 0 ||
    !Number.isFinite(maxAngle) ||
    Math.fround(maxAngle) <= 0 ||
    maxAngle > 0.1
  )
    throw Error(
      "Contact recycling requires a positive distance and maxAngle in (0, 0.1] radians",
    );
  return Object.freeze({ distance, maxAngle });
}

// Structural edits invalidate geometry without a GPU readback. Pose commands
// already invalidate affected manifolds in the normal batched command pipeline.
export function invalidateContactRecycling(s) {
  if (!s.contactRecycling) return;
  const epoch = (s.contactRecyclingEpoch ?? 1) + 1;
  // GPU padding stores the epoch as f32. Clear tails before reusing an epoch
  // after 16 million structural edits; CPU caches can retain integer epochs.
  if (s.device && epoch > 0xffffff) {
    const stride = s.manifoldCapacity === undefined ? 80 : 64;
    const offset = s.contactCapacity * stride;
    const encoder = s.device.createCommandEncoder();
    for (const buffer of s.contactBuffers) encoder.clearBuffer(buffer, offset);
    s.device.queue.submit([encoder.finish()]);
    s.contactRecyclingEpoch = 1;
  } else s.contactRecyclingEpoch = epoch;
}

const replace = (source, from, to) => {
  if (!source.includes(from))
    throw Error("Contact recycling shader layout changed");
  return source.replace(from, to);
};
const constants = (options) => `
const RECYCLE_DISTANCE = ${options.distance};
const RECYCLE_ANGLE = ${options.maxAngle};
`;

export function withContactRecycling3D(source, options) {
  const start = source.indexOf(
    "  let generated =",
    source.indexOf("fn reuseContacts("),
  );
  const end = source.indexOf("  let m = atomicAdd", start);
  if (start < 0 || end < 0) throw Error("3D contact recycling layout changed");
  source =
    source.slice(0, start) +
    `
  if (count == 0u || !canRecycle3D(a,b,u32(pm))) { return false; }
  atomicAdd(&counters[8],1u);
` +
    source.slice(end);
  source = replace(
    source,
    "  manifolds[m] = Manifold(vec4u(a, b, base, prev.ids.w), prev.geo);",
    `  manifolds[m] = Manifold(vec4u(a,b,base,prev.ids.w),vec4f(prev.geo.xyz,sqrt(bodies[a].pos.w*bodies[b].pos.w)));
  contacts[params.contactCapacity+m]=prevContacts[params.contactCapacity+u32(pm)];`,
  );
  source = replace(
    source,
    "  let A = makeBox(a);",
    "  atomicAdd(&counters[9],1u);\n  let A = makeBox(a);",
  );
  source = replace(
    source,
    "  if (count == 0u) { return; }\n\n  let qA = bodies[a].rot;",
    "  if (count == 0u) { return; }\n  cacheRecycle3D(a,b,m);\n\n  let qA = bodies[a].rot;",
  );
  return (
    constants(options) +
    source +
    `
fn rotationDistance3D(a:vec4f,b:vec4f)->f32 {
  // 4*sin(theta/4), conservative for the chord movement bound used below.
  return 2.0*min(length(a-b),length(a+b));
}
fn canRecycle3D(a:u32,b:u32,previous:u32)->bool {
  let A=bodies[a];let B=bodies[b];
  // Rolling contacts move across curved surfaces even without translation.
  if(A.angVel.w==1.0 || B.angVel.w==1.0 || A.angVel.w<0.0 || B.angVel.w<0.0){return false;}
  let c=prevContacts[params.contactCapacity+previous];
  if(c.key!=u32(params.gust.y)){return false;}
  let qa=vec4f(c.pen,c.c0y);let qr=vec4f(c.rB,c.c0x);
  let qb=qmul(qa,qr);
  if(rotationDistance3D(A.rot,qa)>RECYCLE_ANGLE || rotationDistance3D(B.rot,qb)>RECYCLE_ANGLE){return false;}
  let p=qrotate(qconj(A.rot),B.pos.xyz-A.pos.xyz);
  let q=qmul(qconj(A.rot),B.rot);
  let extent=max(select(0.0,A.moment.w,A.size.w>0.0),select(0.0,B.moment.w,B.size.w>0.0));
  let movement=length(p-c.rA)+rotationDistance3D(q,qr)*extent;
  // Tiny bodies must not inherit a tolerance larger than their own geometry.
  let small=min(select(3.4e38,min(A.size.x,min(A.size.y,A.size.z)),A.size.w>0.0),select(3.4e38,min(B.size.x,min(B.size.y,B.size.z)),B.size.w>0.0));
  return movement<min(RECYCLE_DISTANCE,0.05*small);
}
fn cacheRecycle3D(a:u32,b:u32,m:u32){
  let A=bodies[a];let B=bodies[b];var c:Contact;
  c.rA=qrotate(qconj(A.rot),B.pos.xyz-A.pos.xyz);
  let qr=qmul(qconj(A.rot),B.rot);c.rB=qr.xyz;c.c0x=qr.w;
  c.pen=A.rot.xyz;c.c0y=A.rot.w;c.key=u32(params.gust.y);
  contacts[params.contactCapacity+m]=c;
}
`
  );
}

export function withContactRecycling2D(source, options, shaped) {
  source = replace(
    source,
    "if ((params.flags & FLAG_MATCH_NEAREST) != 0u) {",
    "if (true) {",
  );
  source = replace(
    source,
    "  let A = bodies[a];\n  let B = bodies[b];",
    `
  if(recycle2D(a,b)){return;}
  atomicAdd(&counters[9],1u);
  let A = bodies[a];
  let B = bodies[b];`,
  );
  source = replace(
    source,
    "    contacts[k] = rec;",
    `
    contacts[k] = rec;
    var cache:Contact;
    cache.ids=vec4u(params.pad0,0u,0u,0u);
    cache.anchors=vec4f(rot(-A.pose.z,B.pose.xy-A.pose.xy),B.pose.z-A.pose.z,A.pose.z);
    contacts[params.contactCapacity+k]=cache;`,
  );
  return (
    constants(options) +
    source +
    `
fn recycle2D(a:u32,b:u32)->bool {
  let A=bodies[a];let B=bodies[b];
  if(A.prevVel.w!=0.0 || B.prevVel.w!=0.0){return false;}
  ${shaped ? "if((geometry[a].x!=0.0 && geometry[a].x!=4.0) || (geometry[b].x!=0.0 && geometry[b].x!=4.0)){return false;}" : ""}
  let previous=hashFind(a,b,PAIR_ENTRY);if(previous<0){return false;}
  let first=u32(previous);let prev=prevContacts[first];
  if((prev.ids.w&0x80000000u)!=0u){return false;}
  let cache=prevContacts[params.contactCapacity+first];
  if(cache.ids.x!=params.pad0){return false;}
  let qa=cache.anchors.w;let qr=cache.anchors.z;
  if(abs(A.pose.z-qa)>RECYCLE_ANGLE || abs(B.pose.z-qa-qr)>RECYCLE_ANGLE){return false;}
  let p=rot(-A.pose.z,B.pose.xy-A.pose.xy);
  let extent=max(select(0.0,0.5*length(A.shape.xy),A.shape.z>0.0),select(0.0,0.5*length(B.shape.xy),B.shape.z>0.0));
  let movement=length(p-cache.anchors.xy)+abs(B.pose.z-A.pose.z-qr)*extent;
  let small=min(select(3.4e38,min(A.shape.x,A.shape.y),A.shape.z>0.0),select(3.4e38,min(B.shape.x,B.shape.y),B.shape.z>0.0));
  if(movement>=min(RECYCLE_DISTANCE,0.05*small)){return false;}
  var count=1u;
  if(first+1u<atomicLoad(&counters[C_PREV_CONTACTS])){
    let next=prevContacts[first+1u].ids;
    if(next.x==a && next.y==b){count=2u;}
  }
  let base=atomicAdd(&counters[C_CONTACTS],count);
  if(base+count>params.contactCapacity){atomicOr(&counters[C_OVERFLOW],2u);return true;}
  for(var i=0u;i<count;i++){
    var k=prevContacts[first+i];let n=k.geo.zw;
    let d=A.pose.xy+rot(A.pose.z,k.anchors.xy)-B.pose.xy-rot(B.pose.z,k.anchors.zw);
    k.geo=vec4f(dot(n,d)+COLLISION_MARGIN,n.y*d.x-n.x*d.y,n);
    k.misc.x=sqrt(A.pose.w*B.pose.w);
    if((params.flags&FLAG_VBD)!=0u){k.pl=vec4f(params.vbdStiffness,params.vbdStiffness,k.pl.zw);}
    else{
      if((params.flags&FLAG_POST_STABILIZE)==0u){k.pl=vec4f(k.pl.xy,k.pl.zw*params.alpha*params.gamma);}
      k.pl=vec4f(clamp(k.pl.xy*params.gamma,vec2f(PENALTY_MIN),vec2f(PENALTY_MAX)),k.pl.zw);
    }
    contacts[base+i]=k;
    // Never advance the cached transform on reuse: all motion accumulates
    // against the configuration at which narrowphase actually ran.
    contacts[params.contactCapacity+base+i]=prevContacts[params.contactCapacity+first+i];
  }
  atomicAdd(&counters[8],1u);return true;
}
`
  );
}

/** Explicit diagnostics only. Live stepping never reads these cumulative counts. */
export async function readContactRecyclingStats() {
  if (this.destroyed) throw Error("The solver has been destroyed");
  if (!this.contactRecycling) return { recycledPairs: 0, evaluatedPairs: 0 };
  const data = new Uint32Array(await this.read(this.counterBuffer, 64));
  return { recycledPairs: data[8], evaluatedPairs: data[9] };
}
