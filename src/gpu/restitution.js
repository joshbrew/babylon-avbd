import { PRELUDE_3D } from "../../reference/three-avbd/src/avbd3d/gpu/layout.ts";
import { propertyEdits } from "./bufferEdits.js";

// Optional velocity-level normal impulses after the position solve. Each
// manifold owns its impulse; each body owns its velocity write. Alternating
// pair/body dispatches avoid float atomics and simultaneous neighbor writes.
const shader = `${PRELUDE_3D}
struct Config { count:u32, joints:u32, capacity:u32, list:u32, threshold:f32, dt:f32, pad0:u32, pad1:u32 }
struct Velocity { incoming:vec4f, incomingAngular:vec4f, linear:vec4f, angular:vec4f }
struct Bounce { impulse:f32, delta:f32, reboundSpeed:f32, inverseMass:f32, rA:vec4f, rB:vec4f }
@group(0) @binding(0) var<uniform> cfg:Config;
@group(0) @binding(1) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(2) var<storage,read_write> velocities:array<Velocity>;
@group(0) @binding(3) var<storage,read> materials:array<f32>;
@group(0) @binding(4) var<storage,read> manifolds:array<Manifold>;
@group(0) @binding(5) var<storage,read> contacts:array<Contact>;
@group(0) @binding(6) var<storage,read> adj:array<u32>;
@group(0) @binding(7) var<storage,read> counters:array<u32>;
@group(0) @binding(8) var<storage,read_write> bounce:array<Bounce>;
fn inverseInertia(i:u32,t:vec3f)->vec3f {
  if(bodies[i].size.w<=0.){return vec3f(0.);}
  let local=qrotate(qconj(bodies[i].rot),t);
  let moment=bodies[i].moment.xyz;
  return qrotate(bodies[i].rot,select(vec3f(0.),local/max(moment,vec3f(1.e-20)),moment>vec3f(0.)));
}
fn inverseMass(i:u32)->f32 {return select(0.,1./max(bodies[i].size.w,1.e-20),bodies[i].size.w>0.);}
fn pointVelocity(i:u32,r:vec3f,incoming:bool)->vec3f {
  let v=velocities[i];
  return select(v.linear.xyz,v.incoming.xyz,incoming)+cross(select(v.angular.xyz,v.incomingAngular.xyz,incoming),r);
}
@compute @workgroup_size(64) fn captureIncoming(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=cfg.count){return;}
  velocities[i].incoming=bodies[i].vel;
  velocities[i].incomingAngular=bodies[i].angVel;
}
@compute @workgroup_size(64) fn captureSolved(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=cfg.count){return;}
  velocities[i].linear=bodies[i].vel;
  velocities[i].angular=bodies[i].angVel;
}
@compute @workgroup_size(64) fn initialize(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=min(counters[C_MANIFOLDS],cfg.capacity)){return;}
  bounce[i]=Bounce(0.,0.,0.,0.,vec4f(0.),vec4f(0.));
  let m=manifolds[i];let count=m.ids.w&15u;
  let a=m.ids.x;let b=m.ids.y;let e=max(materials[a],materials[b]);
  if(count==0u || e<=0. || (m.ids.w&0x80000000u)!=0u || counters[C_OVERFLOW]!=0u || counters[C_CLASHES]!=0u){return;}
  var ra=vec3f(0.);var rb=vec3f(0.);
  for(var c=0u;c<count;c++){let k=contacts[m.ids.z+c];ra+=qrotate(bodies[a].rot,k.rA);rb+=qrotate(bodies[b].rot,k.rB);}
  ra/=f32(count);rb/=f32(count);
  let vn=dot(m.geo.xyz,pointVelocity(a,ra,true)-pointVelocity(b,rb,true));
  if(vn>=-cfg.threshold){return;}
  let ta=cross(ra,m.geo.xyz);let tb=cross(rb,m.geo.xyz);
  let k=inverseMass(a)+inverseMass(b)+dot(ta,inverseInertia(a,ta))+dot(tb,inverseInertia(b,tb));
  if(k<=0.){return;}
  bounce[i]=Bounce(0.,0.,-e*vn,k,vec4f(ra,0.),vec4f(rb,0.));
}
@compute @workgroup_size(64) fn pairs(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=min(counters[C_MANIFOLDS],cfg.capacity)){return;}
  var s=bounce[i];if(s.inverseMass<=0.){return;}
  let m=manifolds[i];let a=m.ids.x;let b=m.ids.y;
  let vn=dot(m.geo.xyz,pointVelocity(a,s.rA.xyz,false)-pointVelocity(b,s.rB.xyz,false));
  // Degree-based relaxation bounds the Jacobi coupling in dense contact graphs.
  let degree=max(1u,max(adj[a+1u]-adj[a],adj[b+1u]-adj[b]));
  let impulse=max(0.,s.impulse+(s.reboundSpeed-vn)/(s.inverseMass*f32(degree)));
  s.delta=impulse-s.impulse;s.impulse=impulse;bounce[i]=s;
}
@compute @workgroup_size(64) fn apply(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=cfg.count || bodies[i].size.w<=0.){return;}
  var dv=vec3f(0.);var dw=vec3f(0.);
  for(var j=adj[i];j<adj[i+1u];j++){
    let key=adj[cfg.list+j];if(key<cfg.joints){continue;}
    let m=manifolds[key-cfg.joints];let s=bounce[key-cfg.joints];
    if(s.inverseMass<=0.){continue;}
    let isA=i==m.ids.x;let impulse=m.geo.xyz*s.delta*select(-1.,1.,isA);
    dv+=impulse*inverseMass(i);dw+=inverseInertia(i,cross(select(s.rB.xyz,s.rA.xyz,isA),impulse));
  }
  velocities[i].linear+=vec4f(dv,0.);velocities[i].angular+=vec4f(dw,0.);
}
@compute @workgroup_size(64) fn writeBack(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=cfg.count || bodies[i].size.w<=0.){return;}
  bodies[i].vel=velocities[i].linear;bodies[i].angVel=velocities[i].angular;
}
`;

export class Restitution {
  constructor(solver, { code = shader, dimension = 3 } = {}) {
    this.solver = solver;
    this.dimension = dimension;
    this.device = solver.device;
    this.active = new Set();
    const d = this.device,
      usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
    this.materials = d.createBuffer({ size: solver.bodyCapacity * 4, usage });
    this.velocities = d.createBuffer({ size: solver.bodyCapacity * 64, usage });
    this.params = d.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.layout = d.createBindGroupLayout({
      entries: [
        "uniform",
        "storage",
        "storage",
        "read-only-storage",
        "read-only-storage",
        "read-only-storage",
        "read-only-storage",
        "read-only-storage",
        "storage",
      ].map((type, binding) => ({
        binding,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type },
      })),
    });
    const module = d.createShaderModule({ code }),
      layout = d.createPipelineLayout({ bindGroupLayouts: [this.layout] });
    this.pipes = Object.fromEntries(
      [
        "captureIncoming",
        "captureSolved",
        "initialize",
        "pairs",
        "apply",
        "writeBack",
      ].map((entryPoint) => [
        entryPoint,
        d.createComputePipeline({ layout, compute: { module, entryPoint } }),
      ]),
    );
  }
  set(index, value) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw Error("restitution must be between 0 and 1");
    if (value > 0) this.active.add(index);
    else this.active.delete(index);
    propertyEdits(this.solver).float(this.materials, index, value);
  }
  bind() {
    const s = this.solver,
      d = this.device;
    const storage =
      this.dimension === 3
        ? s.contactStorage
        : {
            manifolds: s.contactBuffers[1 - s.parity],
            contacts: s.contactBuffers[1 - s.parity],
            counters: s.counterBuffer,
          };
    const capacity =
      this.dimension === 3 ? s.manifoldCapacity : s.contactCapacity;
    if (this.capacity !== capacity) {
      this.bounce?.destroy();
      this.capacity = capacity;
      this.bounce = d.createBuffer({
        size: Math.max(1, this.capacity) * 48,
        usage: GPUBufferUsage.STORAGE,
      });
    }
    const buffers = [
      this.params,
      s.bodyBuffer,
      this.velocities,
      this.materials,
      storage.manifolds,
      storage.contacts,
      s.adjBuffer,
      storage.counters,
      this.bounce,
    ];
    if (!this.buffers || buffers.some((b, i) => b !== this.buffers[i])) {
      this.buffers = buffers;
      this.group = d.createBindGroup({
        layout: this.layout,
        entries: buffers.map((buffer, binding) => ({
          binding,
          resource: { buffer },
        })),
      });
    }
    const cfg = new Uint32Array([
      s.bodyCount,
      s.jointCount,
      capacity,
      2 * s.bodyCapacity + 1,
      0,
      0,
      0,
      0,
    ]);
    new Float32Array(cfg.buffer).set([1, s.params.dt], 4);
    d.queue.writeBuffer(this.params, 0, cfg);
  }
  run(entries, encoder) {
    this.bind();
    const e = encoder ?? this.device.createCommandEncoder(),
      p = e.beginComputePass();
    p.setBindGroup(0, this.group);
    for (const name of entries) {
      p.setPipeline(this.pipes[name]);
      p.dispatchWorkgroups(
        Math.max(
          1,
          Math.ceil(
            (name === "initialize" || name === "pairs"
              ? this.capacity
              : this.solver.bodyCount) / 64,
          ),
        ),
      );
    }
    p.end();
    if (!encoder) this.device.queue.submit([e.finish()]);
  }
  before(encoder) {
    if (this.active.size) this.run(["captureIncoming"], encoder);
  }
  after(encoder) {
    if (this.active.size)
      this.run(
        [
          "captureSolved",
          "initialize",
          ...Array.from({ length: 12 }, () => ["pairs", "apply"]).flat(),
          "writeBack",
        ],
        encoder,
      );
  }
  destroy() {
    for (const key of ["materials", "velocities", "params", "bounce"])
      this[key]?.destroy();
  }
}
