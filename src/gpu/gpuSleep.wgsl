struct Body {pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f}
struct Sleep {mass:f32,quiet:u32,awake:u32,original:u32,support:vec4u}
struct Params {count:u32,cells:u32,nx:u32,ny:u32,nz:u32,projectile:u32,cell:f32,dt:f32,min:vec4f}
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read> snapshot:array<Body>;
@group(0) @binding(2) var<storage,read_write> sleep:array<Sleep>;
@group(0) @binding(3) var<storage,read_write> heads:array<atomic<u32>>;
@group(0) @binding(4) var<storage,read_write> next:array<u32>;
@group(0) @binding(5) var<uniform> params:Params;
const NONE:u32=0xffffffffu;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
fn extent(b:Body)->vec3f{return (abs(rotate(b.rot,vec3f(1,0,0)))*b.size.x+abs(rotate(b.rot,vec3f(0,1,0)))*b.size.y+abs(rotate(b.rot,vec3f(0,0,1)))*b.size.z)*.5;}
fn cell(p:vec3f)->vec3u{return vec3u(clamp(floor((p-params.min.xyz)/params.cell),vec3f(0),vec3f(f32(params.nx-1),f32(params.ny-1),f32(params.nz-1))));}
fn index(c:vec3u)->u32{return (c.z*params.ny+c.y)*params.nx+c.x;}
fn compression(a:Body,b:Body,pad:f32)->bool {
 let d=a.pos.xyz-b.pos.xyz;let overlap=extent(a)+extent(b)+vec3f(pad)-abs(d);
 if(any(overlap<vec3f(0))){return false;}
 var axis=0u;if(overlap.y<overlap.x){axis=1u;}if(overlap.z<overlap[axis]){axis=2u;}
 let sign=select(-1.,1.,d[axis]>=0.);
 // Closing speed at the nearest face, including the rotational sweep.
 let arm=clamp(a.pos.xyz-b.pos.xyz,-extent(b),extent(b));
 let closing=(b.velocity.xyz+cross(b.angular.xyz,arm))[axis]*sign;
 return closing>.15 || min(min(overlap.x,overlap.y),overlap.z)>pad+.03;
}
@compute @workgroup_size(256) fn clear(@builtin(global_invocation_id) g:vec3u){if(g.x<params.cells){atomicStore(&heads[g.x],NONE);}if(g.x==0u){atomicStore(&heads[params.cells],0u);}}
@compute @workgroup_size(256) fn build(@builtin(global_invocation_id) g:vec3u){let i=g.x;if(i>=params.count||i==params.projectile||snapshot[i].size.w<=0.){return;}let h=index(cell(snapshot[i].pos.xyz));next[i]=atomicExchange(&heads[h],i);}
@compute @workgroup_size(256) fn initialize(@builtin(global_invocation_id) g:vec3u){let i=g.x;if(i>=params.count){return;}if(sleep[i].mass>0.&&sleep[i].awake==0u){bodies[i].size.w=0.;}}
@compute @workgroup_size(256) fn wake(@builtin(global_invocation_id) g:vec3u){
 let i=g.x;if(i>=params.count||sleep[i].mass<=0.||sleep[i].awake!=0u){return;}
 let b=snapshot[i];let e=extent(b);var awake=false;
 let ball=snapshot[params.projectile];var swept=ball;swept.pos.xyz+=ball.velocity.xyz*params.dt;
 awake=compression(b,ball,.03)||compression(b,swept,.03);
 // The original support graph is valid for untouched sleepers. Test actual
 // current poses, so removing a support wakes a dependent even after it leaves.
 var supported=b.pos.z-e.z<=.015;
 for(var k=0u;k<4u;k++) {let j=sleep[i].support[k];if(j==NONE){continue;}let other=snapshot[j];let oe=extent(other);let top=other.pos.z+oe.z;let bottom=b.pos.z-e.z;
 supported=supported||(abs(b.pos.x-other.pos.x)<e.x+oe.x-.01&&abs(b.pos.y-other.pos.y)<e.y+oe.y-.01&&abs(top-bottom)<.04&&other.pos.z<b.pos.z);
 }
 let c=vec3i(cell(b.pos.xyz));
 for(var z=-1;z<=1;z++){for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
  let n=c+vec3i(x,y,z);if(any(n<vec3i(0))||n.x>=i32(params.nx)||n.y>=i32(params.ny)||n.z>=i32(params.nz)){continue;}
  var j=atomicLoad(&heads[index(vec3u(n))]);
  loop{if(j==NONE){break;}awake=awake||compression(b,snapshot[j],.015);j=next[j];}
 }}}
 if(awake||!supported){sleep[i].awake=1u;sleep[i].quiet=0u;bodies[i].size.w=sleep[i].mass;}
}
@compute @workgroup_size(256) fn rest(@builtin(global_invocation_id) g:vec3u){
 let i=g.x;if(i>=params.count||sleep[i].mass<=0.||sleep[i].awake==0u||i==params.projectile){return;}
 let b=bodies[i];if(length(b.velocity.xyz)<.02&&length(b.angular.xyz)<.04){sleep[i].quiet+=1u;}else{sleep[i].quiet=0u;}
 // Once motion has remained small for a second, capture the supports at the
 // new resting pose. This lets debris sleep on other debris and preserves
 // the dependencies needed to wake it if that new support is removed.
 if(sleep[i].quiet>=60u){
  let e=extent(b);var found=vec4u(NONE);var count=0u;
  for(var k=0u;k<4u;k++){let j=sleep[i].support[k];if(j==NONE){continue;}let o=snapshot[j];let oe=extent(o);if(abs(b.pos.x-o.pos.x)<e.x+oe.x-.01&&abs(b.pos.y-o.pos.y)<e.y+oe.y-.01&&abs(o.pos.z+oe.z-(b.pos.z-e.z))<.04&&o.pos.z<b.pos.z){found[count]=j;count++;}}
  let c=vec3i(cell(b.pos.xyz));
  for(var z=-1;z<=1;z++){for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
   let n=c+vec3i(x,y,z);if(any(n<vec3i(0))||n.x>=i32(params.nx)||n.y>=i32(params.ny)||n.z>=i32(params.nz)){continue;}
   var j=atomicLoad(&heads[index(vec3u(n))]);loop{if(j==NONE){break;}let o=snapshot[j];let oe=extent(o);if(count<4u&&all(found!=vec4u(j))&&abs(b.pos.x-o.pos.x)<e.x+oe.x-.01&&abs(b.pos.y-o.pos.y)<e.y+oe.y-.01&&abs(o.pos.z+oe.z-(b.pos.z-e.z))<.04&&o.pos.z<b.pos.z){found[count]=j;count++;}j=next[j];}
  }}}
  sleep[i].support=found;
 }
 // Re-sleep only at a supported pose, using the refreshed graph or floor.
 let e=extent(b);var supported=b.pos.z-e.z<=.015;
 for(var k=0u;k<4u;k++){let j=sleep[i].support[k];if(j==NONE){continue;}let o=snapshot[j];let oe=extent(o);supported=supported||(abs(b.pos.x-o.pos.x)<e.x+oe.x-.01&&abs(b.pos.y-o.pos.y)<e.y+oe.y-.01&&abs(o.pos.z+oe.z-(b.pos.z-e.z))<.04&&o.pos.z<b.pos.z);}
 if(sleep[i].quiet>=120u&&supported){sleep[i].awake=0u;bodies[i].size.w=0.;bodies[i].velocity.xyz=vec3f(0);bodies[i].angular.xyz=vec3f(0);}
}
@compute @workgroup_size(256) fn countAwake(@builtin(global_invocation_id) g:vec3u){let i=g.x;if(i<params.count&&sleep[i].mass>0.&&sleep[i].awake!=0u){atomicAdd(&heads[params.cells],1u);}}
